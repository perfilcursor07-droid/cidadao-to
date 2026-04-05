import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import DiarioAnalysis from '../models/DiarioAnalysis';
import { analyzeWithDeepSeek } from './together.service';
import { env } from '../config/env';

const DOETO_URL = 'https://doe.to.gov.br';
const DOETO_SEARCH_URL = 'https://diariooficial.to.gov.br';
const MAX_TEXT_CHARS = 30000;

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: '*/*',
};

// ─── Scraping da página do DOE-TO ────────────────────────────────────────────

/**
 * Converte data DD/MM/YYYY para YYYY-MM-DD
 */
function parseBrDate(brDate: string): string {
  const [d, m, y] = brDate.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Faz scraping da página principal do DOE-TO e retorna um mapa de data → IDs.
 * Tenta ambos os domínios (doe.to.gov.br e diariooficial.to.gov.br).
 */
async function scrapeEditionMap(): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  const urls = [DOETO_URL, DOETO_SEARCH_URL];

  for (const baseUrl of urls) {
    try {
      const res = await axios.get(baseUrl, {
        timeout: 15000,
        headers: { ...REQUEST_HEADERS, Accept: 'text/html' },
        maxRedirects: 5,
      });
      const html: string = res.data;

      // Regex para capturar links de download com ID e a data associada
      const pattern = /diario\/(\d+)\/download.*?(\d{2}\/\d{2}\/\d{4})/gs;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(html)) !== null) {
        const id = parseInt(match[1]);
        const dateStr = parseBrDate(match[2]);
        const existing = map.get(dateStr) || [];
        if (!existing.includes(id)) {
          existing.push(id);
        }
        map.set(dateStr, existing);
      }

      if (map.size > 0) {
        console.log(`[Diário] Scraping (${baseUrl}): ${map.size} datas encontradas`);
        for (const [date, ids] of map) {
          console.log(`[Diário]   ${date} → IDs: ${ids.join(', ')}`);
        }
        return map;
      }
    } catch (err: any) {
      console.error(`[Diário] Erro no scraping de ${baseUrl}: ${err.message}`);
    }
  }

  return map;
}

/**
 * Busca o ID da edição para uma data via página de busca do DOE-TO.
 * URL: https://diariooficial.to.gov.br/busca?por=texto&texto=&data-inicial=YYYY-MM-DD&data-final=YYYY-MM-DD
 */
async function searchEditionByDate(date: string): Promise<number | null> {
  const urls = [DOETO_SEARCH_URL, DOETO_URL];

  for (const baseUrl of urls) {
    try {
      const searchUrl = `${baseUrl}/busca?por=texto&texto=&data-inicial=${date}&data-final=${date}`;
      console.log(`[Diário] Buscando via: ${searchUrl}`);
      const res = await axios.get(searchUrl, {
        timeout: 15000,
        headers: { ...REQUEST_HEADERS, Accept: 'text/html' },
        maxRedirects: 5,
      });
      const html: string = res.data;

      // Pega todos os IDs de download na página de resultado
      const ids: number[] = [];
      const pattern = /diario\/(\d+)\/download/g;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const id = parseInt(match[1]);
        if (!ids.includes(id)) ids.push(id);
      }

      if (ids.length > 0) {
        const bestId = Math.max(...ids);
        console.log(`[Diário] Busca retornou IDs: ${ids.join(', ')} → usando ${bestId}`);
        return bestId;
      }
    } catch (err: any) {
      console.error(`[Diário] Erro na busca em ${baseUrl}: ${err.message}`);
    }
  }

  return null;
}

/**
 * Encontra o ID da edição para uma data específica.
 * 1. Tenta scraping da página principal
 * 2. Fallback: busca por data no site
 */
async function findEditionId(date: string): Promise<number | null> {
  console.log(`[Diário] Buscando ID real para ${date}...`);

  // Tenta scraping da página principal
  const editionMap = await scrapeEditionMap();
  const ids = editionMap.get(date);

  if (ids && ids.length > 0) {
    const bestId = Math.max(...ids);
    console.log(`[Diário] ID encontrado via página principal para ${date}: ${bestId}`);
    return bestId;
  }

  console.log(`[Diário] Data ${date} não encontrada na página principal. Tentando busca...`);

  // Fallback: busca por data
  return searchEditionByDate(date);
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
  let parsed: any;
  try {
    const clean = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    parsed = { summary: aiResponse, categories: [], highlights: [], alerts: [], keywords: [] };
  }

  const edition = extractEditionNumber(rawText);

  // Salva tudo no campo items (que é JSON) pra manter compatibilidade
  const fullData = {
    categories: parsed.categories || [],
    highlights: parsed.highlights || [],
    impact: parsed.impact || 'neutro',
    impact_reason: parsed.impact_reason || '',
  };

  const record = await DiarioAnalysis.create({
    edition: edition || String(editionId),
    edition_date: date as any,
    raw_text: rawText.substring(0, 100000),
    summary: parsed.summary || '',
    items: fullData,
    alerts: parsed.alerts || [],
    keywords: parsed.keywords || [],
    ai_model: 'deepseek-ai/DeepSeek-V3.1',
  });

  console.log(`[Diário] Análise de ${date} salva! ID=${record.id} Edição=${edition}`);
  return { success: true, message: `Edição de ${date} (Nº ${edition}) analisada com sucesso!`, id: record.id };
}

/**
 * Busca as últimas N edições disponíveis no site do DOE-TO.
 * Retorna as datas únicas ordenadas (mais recente primeiro).
 */
export async function getLatestEditionDates(count: number = 10): Promise<string[]> {
  const editionMap = await scrapeEditionMap();
  const dates = Array.from(editionMap.keys()).sort((a, b) => b.localeCompare(a));
  return dates.slice(0, count);
}

/**
 * Baixa e analisa as últimas N edições do DOE-TO.
 * Processa sequencialmente para não sobrecarregar a API.
 */
export async function fetchLastNDiarios(
  count: number = 10,
  onProgress?: (current: number, total: number, date: string, result: string) => void
): Promise<{ total: number; success: number; skipped: number; failed: number; details: string[] }> {
  const dates = await getLatestEditionDates(count);
  const details: string[] = [];
  let success = 0, skipped = 0, failed = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    try {
      const result = await fetchAndAnalyzeDiario(date);
      if (result.success && result.message.includes('já analisada')) {
        skipped++;
        details.push(`${date}: já analisada`);
        onProgress?.(i + 1, dates.length, date, 'skipped');
      } else if (result.success) {
        success++;
        details.push(`${date}: ${result.message}`);
        onProgress?.(i + 1, dates.length, date, 'success');
      } else {
        failed++;
        details.push(`${date}: ${result.message}`);
        onProgress?.(i + 1, dates.length, date, 'failed');
      }
    } catch (err: any) {
      failed++;
      details.push(`${date}: Erro - ${err.message}`);
      onProgress?.(i + 1, dates.length, date, 'failed');
    }
  }

  return { total: dates.length, success, skipped, failed, details };
}
