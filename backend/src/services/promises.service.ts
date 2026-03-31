import axios from 'axios';
import { env } from '../config/env';
import Politician from '../models/Politician';
import PromiseModel from '../models/Promise';
import { searchNews, NewsArticle } from './news-search.service';

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

async function askAI(prompt: string): Promise<string> {
  const response = await axios.post(
    `${TOGETHER_URL}/chat/completions`,
    { model: MODEL, max_tokens: 4096, temperature: 0.2, messages: [{ role: 'user', content: prompt }] },
    { headers: { Authorization: `Bearer ${env.TOGETHER_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  return response.data.choices[0].message.content as string;
}

function parseJSON(raw: string): any {
  try {
    return JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
  } catch { return null; }
}

/**
 * ETAPA 1: Busca notícias reais sobre o político e extrai promessas.
 * Cada promessa terá o link da notícia como fonte.
 */
export async function researchPoliticianPromises(politicianId: number) {
  const pol = await Politician.findByPk(politicianId);
  if (!pol) throw new Error('Político não encontrado');

  const role = ROLE_LABELS[pol.role] || pol.role;
  const mandate = MANDATE_PERIODS[pol.role] || '2023-2026';

  console.log(`[Promises] Buscando notícias de ${pol.name}...`);

  // 1. Busca notícias reais sobre promessas do político
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

  // Remove duplicatas por URL
  const uniqueArticles = [...new Map(allArticles.map(a => [a.url, a])).values()];
  console.log(`[Promises] ${uniqueArticles.length} notícias encontradas para ${pol.name}`);

  if (uniqueArticles.length === 0) {
    return { politician: pol.name, found: 0, created: 0, updated: 0, articles: 0 };
  }

  // 2. Monta contexto com as notícias reais
  const newsContext = uniqueArticles.slice(0, 8).map((a, i) =>
    `[${i + 1}] "${a.title}" - ${a.source} (${a.date})\nURL: ${a.url}\n${a.snippet}`
  ).join('\n\n');

  // 3. Pede pra IA extrair promessas DAS NOTÍCIAS (não inventar)
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
- status: "done" se a notícia diz que foi concluído, "progress" se está em andamento, "pending" se foi prometido mas sem ação, "failed" se foi abandonado.
- Mínimo 2, máximo 8 promessas.`;

  const raw = await askAI(prompt);
  const parsed = parseJSON(raw);
  if (!parsed?.promises) {
    return { politician: pol.name, found: 0, created: 0, updated: 0, articles: uniqueArticles.length };
  }

  let created = 0, updated = 0;

  for (const p of parsed.promises) {
    if (!p.title) continue;

    // Pega a notícia fonte pelo index
    const sourceIdx = (p.source_index || 1) - 1;
    const sourceArticle = uniqueArticles[sourceIdx] || uniqueArticles[0];

    const sourceData = JSON.stringify({
      url: sourceArticle.url,
      title: sourceArticle.title,
      source: sourceArticle.source,
      date: sourceArticle.date,
      type: 'noticia',
    });

    const [record, wasCreated] = await PromiseModel.findOrCreate({
      where: { politician_id: politicianId, title: p.title },
      defaults: {
        politician_id: politicianId,
        title: p.title,
        description: p.description || '',
        area: p.area || 'Outro',
        status: p.status || 'pending',
        progress_pct: Math.min(100, Math.max(0, p.progress_pct || 0)),
        source_url: sourceData,
      },
    });

    if (!wasCreated) {
      await record.update({
        status: p.status || record.status,
        progress_pct: p.progress_pct ?? record.progress_pct,
        source_url: sourceData,
      });
      updated++;
    } else {
      created++;
    }
  }

  console.log(`[Promises] ${pol.name}: ${parsed.promises.length} extraídas, ${created} novas, ${updated} atualizadas`);
  return { politician: pol.name, found: parsed.promises.length, created, updated, articles: uniqueArticles.length };
}

/**
 * ETAPA 2: Pesquisa promessas de TODOS os políticos.
 */
export async function researchAllPromises() {
  const politicians = await Politician.findAll({ where: { active: true } });
  const details: any[] = [];
  let total_found = 0, total_created = 0, total_updated = 0;

  for (const pol of politicians) {
    try {
      const result = await researchPoliticianPromises(pol.id);
      details.push(result);
      total_found += result.found;
      total_created += result.created;
      total_updated += result.updated;
    } catch (err: any) {
      console.error(`[Promises] Erro com ${pol.name}: ${err.message}`);
      details.push({ politician: pol.name, found: 0, created: 0, updated: 0 });
    }
    // Delay entre políticos
    await new Promise(r => setTimeout(r, 3000));
  }

  return { total_politicians: politicians.length, total_found, total_created, total_updated, details };
}

/**
 * ETAPA 3: Atualiza status das promessas buscando notícias recentes.
 * Roda diariamente via cron job.
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
    const articles = await searchNews(`${pol.name} Tocantins realizações obras`, 5);
    if (articles.length === 0) continue;

    const newsContext = articles.slice(0, 5).map((a, i) =>
      `[${i + 1}] "${a.title}" - ${a.source}\nURL: ${a.url}\n${a.snippet}`
    ).join('\n\n');

    const promisesList = polPromises.map(p =>
      `- "${p.title}" (status: ${p.status}, ${p.progress_pct}%)`
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
      "title": "título exato da promessa",
      "status": "pending|progress|done|failed",
      "progress_pct": 0-100,
      "source_index": 1,
      "reason": "por que mudou"
    }
  ]
}
Só inclua promessas que MUDARAM de status baseado nas notícias.`;

    try {
      const raw = await askAI(prompt);
      const parsed = parseJSON(raw);

      for (const u of (parsed?.updates || [])) {
        const promise = polPromises.find(p => p.title === u.title);
        if (!promise || promise.status === u.status) continue;

        const sourceArticle = articles[(u.source_index || 1) - 1] || articles[0];
        const sourceData = JSON.stringify({
          url: sourceArticle?.url || '',
          title: sourceArticle?.title || '',
          source: sourceArticle?.source || '',
          date: sourceArticle?.date || '',
          type: 'noticia',
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
