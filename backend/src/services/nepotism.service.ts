import axios from 'axios';
import { Op } from 'sequelize';
import { env } from '../config/env';
import Politician from '../models/Politician';
import NepotismAlert from '../models/NepotismAlert';
import DiarioAnalysis from '../models/DiarioAnalysis';
import { searchNews } from './news-search.service';

const TOGETHER_URL = 'https://api.together.xyz/v1';
const MODEL = 'deepseek-ai/DeepSeek-V3.1';

async function askAI(prompt: string): Promise<string> {
  const response = await axios.post(
    `${TOGETHER_URL}/chat/completions`,
    { model: MODEL, max_tokens: 4096, temperature: 0.2, messages: [{ role: 'user', content: prompt }] },
    { headers: { Authorization: `Bearer ${env.TOGETHER_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  return response.data.choices[0].message.content as string;
}

function parseJSON(raw: string): any {
  try { return JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()); }
  catch { return null; }
}

/**
 * Extrai sobrenomes de um político pra buscar parentes.
 */
function getSurnames(name: string): string[] {
  const parts = name.split(' ').filter(w => w.length > 2);
  // Ignora preposições e títulos
  const ignore = ['de', 'da', 'do', 'dos', 'das', 'dr', 'dra', 'professor', 'professora', 'delegado', 'delegada', 'coronel', 'sargento', 'pastor', 'cabo'];
  return parts.filter(p => !ignore.includes(p.toLowerCase()));
}

/**
 * ANÁLISE 1: Cruza sobrenomes dos políticos com nomeações do Diário Oficial.
 */
async function crossWithDiario(politician: Politician): Promise<Array<{ name: string; context: string }>> {
  const surnames = getSurnames(politician.name);
  if (surnames.length < 2) return [];

  // Busca nos diários analisados
  const diarios = await DiarioAnalysis.findAll({
    attributes: ['raw_text', 'edition_date'],
    order: [['edition_date', 'DESC']],
    limit: 10,
  });

  const matches: Array<{ name: string; context: string }> = [];

  for (const diario of diarios) {
    if (!diario.raw_text) continue;
    const text = diario.raw_text;

    // Busca sobrenomes no texto do diário (excluindo o próprio político)
    for (const surname of surnames.slice(1)) { // Pula o primeiro nome
      // Foca em contextos de nomeação/designação
      const regex = new RegExp(`(NOMEAR|DESIGNAR|EXONERAR)[\\s\\S]{0,200}([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+\\s+(?:[a-záéíóúâêîôûãõç]+\\s+)*${surname}[a-záéíóúâêîôûãõç]*)`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const foundName = match[2].trim();
        if (foundName.toLowerCase().includes(politician.name.toLowerCase().split(' ')[0].toLowerCase())) continue;
        if (foundName.length > 5 && foundName !== politician.name) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(text.length, match.index + match[0].length + 50);
          const context = text.substring(start, end).replace(/\n/g, ' ').trim();
          matches.push({ name: foundName, context });
        }
      }
    }
  }

  // Remove duplicatas
  return [...new Map(matches.map(m => [m.name, m])).values()].slice(0, 10);
}

/**
 * ANÁLISE 2: Busca notícias sobre nepotismo/parentesco do político.
 */
async function searchNepotismNews(politician: Politician) {
  const queries = [
    `"${politician.name}" parente nomeado cargo comissionado Tocantins`,
    `"${politician.name}" nepotismo nomeação Tocantins 2024 2025 2026`,
    `"${politician.name}" família cargo confiança governo Tocantins`,
  ];

  const allArticles = [];
  for (const q of queries) {
    const articles = await searchNews(q, 3);
    allArticles.push(...articles);
    await new Promise(r => setTimeout(r, 1000));
  }

  return [...new Map(allArticles.map(a => [a.url, a])).values()];
}

/**
 * ANÁLISE 3: IA analisa tudo e confirma relações.
 */
export async function analyzePoliticianNepotism(politicianId: number) {
  const pol = await Politician.findByPk(politicianId);
  if (!pol) throw new Error('Político não encontrado');

  console.log(`[Nepotismo] Analisando ${pol.name}...`);

  // 1. Cruza com Diário Oficial
  const diarioMatches = await crossWithDiario(pol);
  console.log(`[Nepotismo] ${diarioMatches.length} possíveis parentes no Diário Oficial`);

  // 2. Busca notícias
  const newsArticles = await searchNepotismNews(pol);
  console.log(`[Nepotismo] ${newsArticles.length} notícias encontradas`);

  // 3. Cruza com outros políticos cadastrados (mesmos sobrenomes)
  const surnames = getSurnames(pol.name).slice(1); // Sobrenomes
  const otherPoliticians = await Politician.findAll({
    where: {
      id: { [Op.ne]: pol.id },
      active: true,
      name: { [Op.or]: surnames.map(s => ({ [Op.like]: `%${s}%` })) },
    },
  });

  // 4. Monta contexto pra IA
  let context = '';

  if (diarioMatches.length > 0) {
    context += '\nNOMES COM MESMO SOBRENOME NO DIÁRIO OFICIAL:\n';
    diarioMatches.forEach((m, i) => {
      context += `${i + 1}. ${m.name} — "${m.context}"\n`;
    });
  }

  if (otherPoliticians.length > 0) {
    context += '\nOUTROS POLÍTICOS COM MESMO SOBRENOME:\n';
    otherPoliticians.forEach(p => {
      context += `- ${p.name} (${p.role} - ${p.party})\n`;
    });
  }

  if (newsArticles.length > 0) {
    context += '\nNOTÍCIAS ENCONTRADAS:\n';
    newsArticles.slice(0, 5).forEach((a, i) => {
      context += `[${i + 1}] "${a.title}" - ${a.source}\nURL: ${a.url}\n${a.snippet}\n\n`;
    });
  }

  if (!context.trim()) {
    console.log(`[Nepotismo] Nenhuma evidência encontrada para ${pol.name}`);
    return { politician: pol.name, alerts: 0, created: 0 };
  }

  const prompt = `Analise se o político ${pol.name} (${pol.role} - ${pol.party}, Tocantins) tem parentes nomeados para cargos públicos DURANTE O MANDATO ATUAL (nepotismo).

${context}

Retorne APENAS JSON:
{
  "alerts": [
    {
      "relative_name": "nome completo do parente",
      "relative_role": "cargo comissionado ou de confiança que ocupa",
      "relationship": "filho|filha|esposa|esposo|irmão|irmã|primo|prima|sobrinho|sobrinha|cunhado|cunhada|genro|nora|outro",
      "institution": "órgão onde foi nomeado",
      "evidence": "explicação clara: quando foi nomeado, por quem, qual o cargo",
      "confidence": "alta|media|baixa",
      "source_index": 1
    }
  ]
}

REGRAS IMPORTANTES:
1. Nepotismo é quando um político NOMEIA ou INDICA parentes para cargos de confiança/comissionados no governo.
2. NÃO é nepotismo: pai/mãe que são políticos ELEITOS (foram votados pelo povo). Exemplo: Eduardo Siqueira Campos é filho de Siqueira Campos — isso NÃO é nepotismo pois ambos foram eleitos.
3. NÃO é nepotismo: parentes que passaram em concurso público (cargo efetivo).
4. SÓ é nepotismo: parentes nomeados para cargos COMISSIONADOS, de CONFIANÇA, ou INDICADOS pelo político durante o mandato atual.
5. Foque em nomeações RECENTES (mandato atual 2023-2026 ou 2025-2028).
6. Só inclua se houver EVIDÊNCIA real nas notícias ou documentos acima.
7. confidence "alta": confirmado por notícia com detalhes. "media": mesmo sobrenome nomeado no mesmo órgão. "baixa": apenas suspeita.
8. Se não encontrar nepotismo real, retorne {"alerts": []}.
9. NÃO invente relações. Na dúvida, não inclua.`;

  const raw = await askAI(prompt);
  const parsed = parseJSON(raw);
  if (!parsed?.alerts?.length) {
    return { politician: pol.name, alerts: 0, created: 0 };
  }

  let created = 0;
  for (const alert of parsed.alerts) {
    if (!alert.relative_name) continue;

    const sourceArticle = newsArticles[(alert.source_index || 1) - 1];

    const [, wasCreated] = await NepotismAlert.findOrCreate({
      where: { politician_id: pol.id, relative_name: alert.relative_name },
      defaults: {
        politician_id: pol.id,
        relative_name: alert.relative_name,
        relative_role: alert.relative_role || null,
        relationship: alert.relationship || null,
        institution: alert.institution || null,
        evidence: alert.evidence || null,
        source_url: sourceArticle?.url || null,
        source_title: sourceArticle?.title || null,
        confidence: alert.confidence || 'media',
        status: alert.confidence === 'alta' ? 'confirmado' : 'suspeita',
      },
    });
    if (wasCreated) created++;
  }

  return { politician: pol.name, alerts: parsed.alerts.length, created };
}

/**
 * Analisa TODOS os políticos.
 */
export async function analyzeAllNepotism() {
  const politicians = await Politician.findAll({ where: { active: true } });
  const results = [];
  let totalAlerts = 0;

  for (const pol of politicians) {
    try {
      const result = await analyzePoliticianNepotism(pol.id);
      results.push(result);
      totalAlerts += result.created;
    } catch (err: any) {
      console.error(`[Nepotismo] Erro com ${pol.name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  return { total_politicians: politicians.length, total_alerts: totalAlerts, details: results };
}
