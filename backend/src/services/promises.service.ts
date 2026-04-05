import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { env } from '../config/env';
import Politician from '../models/Politician';
import PromiseModel from '../models/Promise';
import { searchNews, NewsArticle } from './news-search.service';
import { searchWeb } from './websearch.service';

const TOGETHER_URL = 'https://api.together.xyz/v1';
const MODEL = 'deepseek-ai/DeepSeek-V3.1';

const ROLE_LABELS: Record<string, string> = {
  governador: 'Governador do Tocantins',
  prefeito: 'Prefeito',
  senador: 'Senador',
  dep_federal: 'Deputado Federal',
  dep_estadual: 'Deputado Estadual',
  vereador: 'Vereador',
};

const MANDATE_PERIODS: Record<string, string> = {
  governador: '2023-2026',
  prefeito: '2025-2028',
  senador: '2023-2030',
  dep_federal: '2023-2026',
  dep_estadual: '2023-2026',
  vereador: '2025-2028',
};

async function askAI(prompt: string, maxTokens = 4096): Promise<string> {
  const response = await axios.post(
    `${TOGETHER_URL}/chat/completions`,
    { model: MODEL, max_tokens: maxTokens, temperature: 0.2, messages: [{ role: 'user', content: prompt }] },
    { headers: { Authorization: `Bearer ${env.TOGETHER_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 180000 }
  );
  return response.data.choices[0].message.content as string;
}

function parseJSON(raw: string): any {
  try {
    return JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
  } catch { return null; }
}

// ─── Download e extração de PDF ──────────────────────────────────────────────

async function downloadPdfText(url: string): Promise<string> {
  console.log(`[Promises] Baixando PDF: ${url}`);
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxRedirects: 10,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/pdf,*/*',
    },
  });
  console.log(`[Promises] PDF baixado: ${response.status}, ${(response.data as ArrayBuffer).byteLength} bytes`);
  const buffer = Buffer.from(response.data as ArrayBuffer);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = result.text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  console.log(`[Promises] Texto extraído: ${text.length} caracteres`);
  return text;
}

// ─── Busca do plano de governo na internet ───────────────────────────────────

async function findGovernmentPlanUrl(name: string, role: string): Promise<string | null> {
  // Primeiro tenta URLs conhecidas de planos de governo (G1 Promessas, TSE, etc.)
  const nameSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  const knownPatterns = [
    `https://s3.glbimg.com/v1/AUTH_8b29beb0cbe247a296f902be2fe084b6/Promessas/${nameSlug}-TO.pdf`,
    `https://s3.glbimg.com/v1/AUTH_8b29beb0cbe247a296f902be2fe084b6/Promessas/${name.split(' ')[0].toLowerCase()}-${name.split(' ').slice(-1)[0].toLowerCase()}-TO.pdf`,
  ];

  for (const url of knownPatterns) {
    try {
      console.log(`[Promises] Tentando URL conhecida: ${url}`);
      const res = await axios.head(url, { timeout: 8000, validateStatus: s => s === 200 });
      if (res.status === 200) {
        console.log(`[Promises] PDF encontrado em URL conhecida: ${url}`);
        return url;
      }
    } catch {}
  }

  // Busca na web
  const queries = [
    `${name} plano de governo PDF Tocantins`,
    `${name} propostas campanha PDF ${MANDATE_PERIODS[role] || ''}`,
  ];

  for (const query of queries) {
    console.log(`[Promises] Buscando plano: "${query}"`);
    const results = await searchWeb(query, 5);

    for (const r of results) {
      const url = r.url.toLowerCase();
      if (
        url.endsWith('.pdf') ||
        url.includes('plano') ||
        url.includes('proposta') ||
        url.includes('promessas') ||
        url.includes('divulgacandcontas') ||
        url.includes('s3.glbimg.com')
      ) {
        console.log(`[Promises] PDF encontrado via busca: ${r.url}`);
        return r.url;
      }
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  return null;
}

// ─── ETAPA 1: Extrair promessas do plano de governo ─────────────────────────

/**
 * Busca o plano de governo do político na internet, extrai o texto do PDF
 * e usa IA para identificar as promessas de campanha.
 * Aceita URL direta do PDF ou busca automaticamente.
 */
export async function extractPromisesFromPlan(
  politicianId: number,
  pdfUrl?: string
): Promise<{ politician: string; found: number; created: number; skipped: number; pdf_url: string | null }> {
  const pol = await Politician.findByPk(politicianId);
  if (!pol) throw new Error('Político não encontrado');

  const role = ROLE_LABELS[pol.role] || pol.role;
  const mandate = MANDATE_PERIODS[pol.role] || '2023-2026';

  // 1. Encontra o PDF do plano de governo
  let url = pdfUrl?.trim() || null;
  if (url) {
    console.log(`[Promises] URL do PDF fornecida manualmente: ${url}`);
  } else {
    console.log(`[Promises] Buscando plano de governo de ${pol.name} na internet...`);
    url = await findGovernmentPlanUrl(pol.name, pol.role);
  }

  if (!url) {
    console.log(`[Promises] Plano de governo de ${pol.name} não encontrado. Usando busca por notícias como fallback.`);
    return fallbackResearchFromNews(politicianId);
  }

  // 2. Baixa e extrai texto do PDF
  let pdfText: string;
  try {
    pdfText = await downloadPdfText(url);
  } catch (err: any) {
    console.error(`[Promises] Erro ao baixar PDF de ${pol.name}: ${err.message}`);
    console.log(`[Promises] Usando fallback por notícias...`);
    return fallbackResearchFromNews(politicianId);
  }

  if (pdfText.length < 200) {
    console.log(`[Promises] PDF muito curto (${pdfText.length} chars). Usando fallback.`);
    return fallbackResearchFromNews(politicianId);
  }

  console.log(`[Promises] ${pdfText.length} caracteres extraídos do plano de ${pol.name}`);

  // 3. Envia para IA extrair promessas
  const textChunk = pdfText.substring(0, 25000);
  const prompt = `Analise o plano de governo abaixo do político ${pol.name} (${role} - ${pol.party || ''}, mandato ${mandate}, Tocantins).

TEXTO DO PLANO DE GOVERNO:
${textChunk}

Extraia TODAS as promessas de campanha concretas e mensuráveis. Retorne APENAS JSON:
{
  "promises": [
    {
      "title": "título curto e objetivo da promessa (máx 100 chars)",
      "description": "descrição detalhada do que foi prometido",
      "area": "Saúde|Educação|Segurança|Infraestrutura|Economia|Meio Ambiente|Social|Transporte|Cultura|Outro",
      "status": "pending",
      "progress_pct": 0
    }
  ]
}

REGRAS:
- Extraia APENAS promessas concretas (obras, programas, metas numéricas, ações específicas).
- Ignore frases genéricas como "melhorar a saúde" sem ação concreta.
- Cada promessa deve ser verificável (dá pra saber se cumpriu ou não).
- Mínimo 5, máximo 30 promessas.
- Todas começam com status "pending" e progress_pct 0.`;

  const raw = await askAI(prompt, 8192);
  const parsed = parseJSON(raw);
  if (!parsed?.promises) {
    return { politician: pol.name, found: 0, created: 0, skipped: 0, pdf_url: url };
  }

  let created = 0, skipped = 0;

  for (const p of parsed.promises) {
    if (!p.title) continue;

    const sourceData = JSON.stringify({
      url: url,
      title: `Plano de Governo - ${pol.name}`,
      source: 'Plano de Governo',
      date: '',
      type: 'plano_governo',
    });

    const existing = await PromiseModel.findOne({
      where: { politician_id: politicianId, title: p.title },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await PromiseModel.create({
      politician_id: politicianId,
      title: p.title,
      description: p.description || '',
      area: p.area || 'Outro',
      status: 'pending',
      progress_pct: 0,
      source_url: sourceData,
    });
    created++;
  }

  console.log(`[Promises] ${pol.name}: ${parsed.promises.length} promessas extraídas do plano, ${created} novas, ${skipped} já existiam`);
  return { politician: pol.name, found: parsed.promises.length, created, skipped, pdf_url: url };
}

// ─── Fallback: busca por notícias quando não acha o plano ────────────────────

async function fallbackResearchFromNews(politicianId: number) {
  const pol = await Politician.findByPk(politicianId);
  if (!pol) throw new Error('Político não encontrado');

  const role = ROLE_LABELS[pol.role] || pol.role;
  const mandate = MANDATE_PERIODS[pol.role] || '2023-2026';

  const queries = [
    `${pol.name} promessas campanha Tocantins`,
    `${pol.name} ${role} realizações obras Tocantins`,
    `${pol.name} plano governo Tocantins ${mandate}`,
  ];

  const allArticles: NewsArticle[] = [];
  for (const q of queries) {
    const articles = await searchNews(q, 5);
    allArticles.push(...articles);
    await new Promise(r => setTimeout(r, 1000));
  }

  const uniqueArticles = [...new Map(allArticles.map(a => [a.url, a])).values()];
  console.log(`[Promises] Fallback: ${uniqueArticles.length} notícias para ${pol.name}`);

  if (uniqueArticles.length === 0) {
    return { politician: pol.name, found: 0, created: 0, skipped: 0, pdf_url: null };
  }

  const newsContext = uniqueArticles.slice(0, 8).map((a, i) =>
    `[${i + 1}] "${a.title}" - ${a.source} (${a.date})\nURL: ${a.url}\n${a.snippet}`
  ).join('\n\n');

  const prompt = `Analise as notícias abaixo sobre o político ${pol.name} (${role} - ${pol.party || ''}, mandato ${mandate}, Tocantins).

NOTÍCIAS REAIS:
${newsContext}

Com base APENAS nas notícias acima, extraia promessas de campanha e ações do mandato. Retorne APENAS JSON:
{
  "promises": [
    {
      "title": "título curto da promessa ou ação",
      "description": "o que foi prometido ou realizado, baseado na notícia",
      "area": "Saúde|Educação|Segurança|Infraestrutura|Economia|Meio Ambiente|Social|Transporte|Cultura|Outro",
      "status": "pending|progress|done|failed",
      "progress_pct": 0,
      "source_index": 1
    }
  ]
}

REGRAS:
- source_index: número da notícia [1], [2], etc que comprova essa promessa.
- Extraia APENAS informações que estão nas notícias. NÃO invente.
- status: "done" se concluído, "progress" se em andamento, "pending" se prometido sem ação, "failed" se abandonado.
- Mínimo 2, máximo 8 promessas.`;

  const raw = await askAI(prompt);
  const parsed = parseJSON(raw);
  if (!parsed?.promises) {
    return { politician: pol.name, found: 0, created: 0, skipped: 0, pdf_url: null };
  }

  let created = 0, skipped = 0;

  for (const p of parsed.promises) {
    if (!p.title) continue;

    const sourceIdx = (p.source_index || 1) - 1;
    const sourceArticle = uniqueArticles[sourceIdx] || uniqueArticles[0];

    const sourceData = JSON.stringify({
      url: sourceArticle.url,
      title: sourceArticle.title,
      source: sourceArticle.source,
      date: sourceArticle.date,
      type: 'noticia',
    });

    const existing = await PromiseModel.findOne({
      where: { politician_id: politicianId, title: p.title },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await PromiseModel.create({
      politician_id: politicianId,
      title: p.title,
      description: p.description || '',
      area: p.area || 'Outro',
      status: p.status || 'pending',
      progress_pct: Math.min(100, Math.max(0, p.progress_pct || 0)),
      source_url: sourceData,
    });
    created++;
  }

  return { politician: pol.name, found: parsed.promises.length, created, skipped, pdf_url: null };
}

// ─── ETAPA 2: Extrair promessas de TODOS os políticos ────────────────────────

export async function extractAllPromisesFromPlans() {
  const politicians = await Politician.findAll({ where: { active: true } });
  const details: any[] = [];
  let total_found = 0, total_created = 0;

  for (const pol of politicians) {
    try {
      const result = await extractPromisesFromPlan(pol.id);
      details.push(result);
      total_found += result.found;
      total_created += result.created;
    } catch (err: any) {
      console.error(`[Promises] Erro com ${pol.name}: ${err.message}`);
      details.push({ politician: pol.name, found: 0, created: 0, skipped: 0, pdf_url: null, error: err.message });
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  return { total_politicians: politicians.length, total_found, total_created, details };
}

// ─── ETAPA 3: Verificar cumprimento via notícias ─────────────────────────────

/**
 * Pesquisa notícias recentes e atualiza o status das promessas pendentes.
 */
export async function updatePromisesStatus() {
  const promises = await PromiseModel.findAll({
    where: { status: ['pending', 'progress'] },
    include: [{ model: Politician, as: 'politician' }],
  });

  if (promises.length === 0) return { updated: 0, details: [] };

  // Agrupa por político
  const byPol = new Map<number, typeof promises>();
  for (const p of promises) {
    const list = byPol.get(p.politician_id) || [];
    list.push(p);
    byPol.set(p.politician_id, list);
  }

  const details: any[] = [];
  let updated = 0;

  for (const [polId, polPromises] of byPol) {
    const pol = (polPromises[0] as any).politician;
    if (!pol) continue;

    // Busca notícias recentes sobre o político
    const queries = [
      `${pol.name} Tocantins realizações obras 2024 2025 2026`,
      `${pol.name} cumpriu promessa Tocantins`,
    ];

    const allArticles: NewsArticle[] = [];
    for (const q of queries) {
      const articles = await searchNews(q, 5);
      allArticles.push(...articles);
      await new Promise(r => setTimeout(r, 1000));
    }

    const uniqueArticles = [...new Map(allArticles.map(a => [a.url, a])).values()];
    if (uniqueArticles.length === 0) continue;

    const newsContext = uniqueArticles.slice(0, 8).map((a, i) =>
      `[${i + 1}] "${a.title}" - ${a.source}\nURL: ${a.url}\n${a.snippet}`
    ).join('\n\n');

    const promisesList = polPromises.map(p =>
      `- "${p.title}" (status: ${p.status}, ${p.progress_pct}%): ${p.description || ''}`
    ).join('\n');

    const prompt = `Com base nas notícias recentes, atualize o status das promessas do político ${pol.name}:

PROMESSAS ATUAIS:
${promisesList}

NOTÍCIAS RECENTES:
${newsContext}

Retorne APENAS JSON:
{
  "updates": [
    {
      "title": "título EXATO da promessa (copie igual)",
      "status": "pending|progress|done|failed",
      "progress_pct": 0-100,
      "source_index": 1,
      "reason": "evidência da notícia que justifica a mudança"
    }
  ]
}

REGRAS:
- Só inclua promessas que MUDARAM de status baseado nas notícias.
- source_index: número da notícia que comprova.
- Se a notícia mostra obra concluída → done (100%).
- Se mostra obra em andamento → progress (estimar %).
- Se mostra que foi cancelada/abandonada → failed.
- NÃO mude status sem evidência clara na notícia.`;

    try {
      const raw = await askAI(prompt);
      const parsed = parseJSON(raw);

      for (const u of (parsed?.updates || [])) {
        const promise = polPromises.find(p => p.title === u.title);
        if (!promise || promise.status === u.status) continue;

        const sourceArticle = uniqueArticles[(u.source_index || 1) - 1] || uniqueArticles[0];
        const sourceData = JSON.stringify({
          url: sourceArticle?.url || '',
          title: sourceArticle?.title || '',
          source: sourceArticle?.source || '',
          date: sourceArticle?.date || '',
          type: 'verificacao_noticia',
        });

        await promise.update({
          status: u.status,
          progress_pct: u.progress_pct ?? promise.progress_pct,
          source_url: sourceData,
        });

        details.push({
          politician: pol.name,
          promise: promise.title,
          old_status: promise.status,
          new_status: u.status,
          reason: u.reason,
          source: sourceArticle?.url,
        });
        updated++;
      }
    } catch (err: any) {
      console.error(`[Promises] Erro ao atualizar ${pol.name}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  return { updated, details };
}

// ─── Exports legados (mantém compatibilidade) ───────────────────────────────

export { extractPromisesFromPlan as researchPoliticianPromises };
export { extractAllPromisesFromPlans as researchAllPromises };
