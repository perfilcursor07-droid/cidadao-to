import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import DiarioAnalysis from '../models/DiarioAnalysis';
import { analyzeWithDeepSeek } from './together.service';
import { env } from '../config/env';

const DOETO_URL = 'https://doe.to.gov.br';
const MAX_TEXT_CHARS = 15000;

// Referência conhecida: edição 27/03/2026 = ID 5656
const REFERENCE_DATE = '2026-03-27';
const REFERENCE_ID = 5656;

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: '*/*',
};

// ─── Cálculo de ID por dias úteis ────────────────────────────────────────────

/**
 * Conta dias úteis entre duas datas (segunda a sexta).
 * Positivo se `to` é depois de `from`, negativo se antes.
 */
function countBusinessDays(from: string, to: string): number {
  const d1 = new Date(from + 'T12:00:00Z');
  const d2 = new Date(to + 'T12:00:00Z');

  if (d1.getTime() === d2.getTime()) return 0;

  const forward = d2 > d1;
  const start = forward ? d1 : d2;
  const end = forward ? d2 : d1;

  let count = 0;
  const cursor = new Date(start);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor <= end) {
    const day = cursor.getUTCDay(); // 0=Dom, 6=Sáb
    if (day !== 0 && day !== 6) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return forward ? count : -count;
}

/**
 * Estima o ID da edição para uma data específica baseando-se
 * na referência conhecida e contagem de dias úteis.
 */
function estimateEditionId(date: string): number {
  const delta = countBusinessDays(REFERENCE_DATE, date);
  return REFERENCE_ID + delta;
}

// ─── Verificação e download do PDF ───────────────────────────────────────────

/**
 * Verifica se um ID existe tentando baixar os primeiros bytes do PDF.
 */
async function checkIdExists(id: number): Promise<boolean> {
  try {
    const res = await axios.get(`${DOETO_URL}/diario/${id}/download`, {
      timeout: 10000,
      responseType: 'arraybuffer',
      headers: { ...REQUEST_HEADERS, Range: 'bytes=0-1023' },
      validateStatus: (s) => s === 200 || s === 206,
    });
    // Confirma que é um PDF pelos magic bytes %PDF
    const bytes = Buffer.from(res.data as ArrayBuffer);
    return bytes.slice(0, 4).toString('ascii') === '%PDF';
  } catch {
    return false;
  }
}

/**
 * Encontra o ID da edição para uma data específica.
 * Começa no ID estimado e tenta ±5 para cobrir feriados.
 */
async function findEditionId(date: string): Promise<number | null> {
  const estimated = estimateEditionId(date);
  console.log(`[Diário] ID estimado para ${date}: ${estimated}`);

  // Tenta o estimado primeiro, depois expande o range
  const candidates: number[] = [estimated];
  for (let i = 1; i <= 5; i++) {
    candidates.push(estimated + i, estimated - i);
  }

  for (const id of candidates) {
    if (id <= 0) continue;
    if (await checkIdExists(id)) {
      console.log(`[Diário] ID encontrado: ${id}`);
      return id;
    }
  }

  return null;
}

/**
 * Baixa o PDF de uma edição pelo ID e extrai o texto.
 */
async function downloadEditionPdf(id: number): Promise<string> {
  const url = `${DOETO_URL}/diario/${id}/download`;
  console.log(`[Diário] Baixando PDF: ${url}`);

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 90000,
    maxRedirects: 5,
    headers: { ...REQUEST_HEADERS, Accept: 'application/pdf,*/*' },
  });

  const buffer = Buffer.from(response.data as ArrayBuffer);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

/**
 * Limpa e normaliza o texto extraído do PDF.
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Tenta extrair o número da edição do texto do PDF.
 */
function extractEditionNumber(text: string): string {
  // Tenta pegar "Nº 7.027" ou "Edição Nº 7027" ou "ANO XXXVIII - ESTADO DO TOCANTINS ... Nº 7.027"
  const patterns = [
    /N[ºo°]\s*\.?\s*([\d.]+)/i,
    /Edi[çc][aã]o\s*N[ºo°]?\s*\.?\s*([\d.]+)/i,
    /PALMAS.*?N[ºo°]\s*([\d.]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = match[1].replace(/\./g, '');
      if (parseInt(num) > 100) return num; // Ignora números muito pequenos
    }
  }
  return '';
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Job principal: busca, baixa, analisa e salva o Diário Oficial.
 * @param targetDate Data no formato YYYY-MM-DD (padrão: hoje)
 */
export async function fetchAndAnalyzeDiario(
  targetDate?: string
): Promise<{ success: boolean; message: string; id?: number }> {
  if (!env.TOGETHER_API_KEY) {
    return { success: false, message: 'TOGETHER_API_KEY não configurada.' };
  }

  const date = targetDate || new Date().toISOString().split('T')[0];

  // Verifica se já foi analisado
  const existing = await DiarioAnalysis.findOne({ where: { edition_date: date } });
  if (existing) {
    console.log(`[Diário] Edição de ${date} já foi analisada (id=${existing.id}).`);
    return { success: true, message: `Edição de ${date} já analisada.`, id: existing.id };
  }

  console.log(`[Diário] Buscando edição de ${date}...`);

  // Encontra o ID da edição
  const editionId = await findEditionId(date);
  if (!editionId) {
    const msg = `Edição para ${date} não encontrada. Pode ser feriado ou fim de semana.`;
    console.error(`[Diário] ${msg}`);
    return { success: false, message: msg };
  }

  // Baixa e extrai texto
  let rawText: string;
  try {
    rawText = cleanText(await downloadEditionPdf(editionId));
  } catch (err: any) {
    const msg = `Erro ao baixar/extrair PDF (ID ${editionId}): ${err.message}`;
    console.error(`[Diário] ${msg}`);
    return { success: false, message: msg };
  }

  if (rawText.length < 100) {
    return { success: false, message: 'PDF vazio ou protegido.' };
  }

  console.log(`[Diário] ${rawText.length} caracteres extraídos. Enviando para IA...`);

  // Analisa com DeepSeek
  let aiResponse: string;
  try {
    aiResponse = await analyzeWithDeepSeek(rawText.substring(0, MAX_TEXT_CHARS));
  } catch (err: any) {
    return { success: false, message: `Erro na IA: ${err.message}` };
  }

  // Parseia JSON da resposta
  let parsed: { summary: string; items: object[]; alerts: string[]; keywords: string[] };
  try {
    const clean = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    parsed = { summary: aiResponse, items: [], alerts: [], keywords: [] };
  }

  const edition = extractEditionNumber(rawText);

  const record = await DiarioAnalysis.create({
    edition: edition || String(editionId),
    edition_date: date as any,
    raw_text: rawText.substring(0, 100000),
    summary: parsed.summary || '',
    items: parsed.items || [],
    alerts: parsed.alerts || [],
    keywords: parsed.keywords || [],
    ai_model: 'deepseek-ai/DeepSeek-V3.1',
  });

  console.log(`[Diário] Análise de ${date} salva! ID=${record.id} Edição=${edition}`);
  return { success: true, message: `Edição de ${date} (Nº ${edition}) analisada com sucesso!`, id: record.id };
}
