import { Request, Response } from 'express';
import { z } from 'zod';
import DiarioAnalysis from '../models/DiarioAnalysis';
import { analyzeWithDeepSeekStream, chatWithDeepSeekStream } from '../services/together.service';
import { fetchAndAnalyzeDiario } from '../services/diario.service';
import { env } from '../config/env';

const analyzeSchema = z.object({
  text: z.string().min(10),
});

const fetchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * POST /api/diario/analyze
 * Analisa texto colado pelo usuário via streaming.
 */
export async function analyze(req: Request, res: Response) {
  const { text } = analyzeSchema.parse(req.body);

  if (!env.TOGETHER_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA não configurado', code: 'AI_UNAVAILABLE' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    fullResponse = await analyzeWithDeepSeekStream(text, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    });

    let parsed: any = {};
    try {
      const clean = fullResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { summary: fullResponse, items: [], alerts: [], keywords: [] };
    }

    await DiarioAnalysis.create({
      raw_text: text,
      summary: parsed.summary || '',
      items: parsed.items || [],
      alerts: parsed.alerts || [],
      keywords: parsed.keywords || [],
      ai_model: 'deepseek-ai/DeepSeek-V3.1',
      edition_date: new Date(),
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * POST /api/diario/fetch
 * Dispara o download e análise do Diário Oficial.
 * Body: { date?: "YYYY-MM-DD" } — omitir usa a data de hoje.
 * Responde imediatamente com status 202 e processa em background.
 */
export async function triggerFetch(req: Request, res: Response) {
  if (!env.TOGETHER_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA não configurado', code: 'AI_UNAVAILABLE' });
  }

  const { date } = fetchSchema.parse(req.body || {});

  // Responde imediatamente
  res.status(202).json({
    message: `Download do Diário Oficial iniciado${date ? ` para ${date}` : ' (edição de hoje)'}...`,
    date: date || new Date().toISOString().split('T')[0],
  });

  // Processa em background
  fetchAndAnalyzeDiario(date)
    .then(result => console.log('[Diário] Resultado:', result.message))
    .catch(err => console.error('[Diário] Erro:', err.message));
}

/**
 * POST /api/diario/fetch/sync
 * Igual ao fetch mas aguarda o resultado (útil para testes).
 */
export async function triggerFetchSync(req: Request, res: Response) {
  if (!env.TOGETHER_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA não configurado', code: 'AI_UNAVAILABLE' });
  }

  const { date } = fetchSchema.parse(req.body || {});

  try {
    const result = await fetchAndAnalyzeDiario(date);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

const chatSchema = z.object({
  question: z.string().min(3).max(500),
});

/**
 * POST /api/diario/chat
 * Chat com IA sobre o conteúdo dos diários oficiais via streaming.
 * Usa análise estruturada (summary + items) de TODOS os diários primeiro,
 * depois complementa com raw_text se sobrar espaço no contexto.
 */
export async function chat(req: Request, res: Response) {
  const { question } = chatSchema.parse(req.body);

  if (!env.TOGETHER_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA não configurado', code: 'AI_UNAVAILABLE' });
  }

  // Busca os últimos diários com TODOS os campos relevantes
  const analyses = await DiarioAnalysis.findAll({
    order: [['edition_date', 'DESC']],
    limit: 10,
    attributes: ['id', 'edition', 'edition_date', 'raw_text', 'summary', 'items', 'alerts', 'keywords'],
  });

  if (analyses.length === 0) {
    return res.status(404).json({ error: 'Nenhum diário disponível para consulta.' });
  }

  // FASE 1: Monta contexto com análise estruturada (summary + items) de TODOS os diários
  // Isso é compacto e garante que a IA veja todas as edições
  const MAX_CONTEXT = 28000;
  let context = '';

  for (const a of analyses) {
    const dateStr = a.edition_date ? new Date(a.edition_date).toISOString().split('T')[0] : 'sem data';
    let section = `\n=== Edição ${a.edition || '?'} de ${dateStr} ===\n`;

    // Summary
    if (a.summary) section += `Resumo: ${a.summary}\n`;

    // Alertas
    const alerts = (a.alerts as string[] | null) || [];
    if (alerts.length > 0) section += `Alertas: ${alerts.join('; ')}\n`;

    // Keywords
    const keywords = (a.keywords as string[] | null) || [];
    if (keywords.length > 0) section += `Palavras-chave: ${keywords.join(', ')}\n`;

    // Items/categories estruturados (contém os detalhes da análise)
    const items = a.items as any;
    if (items) {
      // Categorias com entries
      if (items.categories && Array.isArray(items.categories)) {
        for (const cat of items.categories) {
          section += `\n[${cat.name}] (${cat.count} itens): ${cat.description || ''}\n`;
          if (cat.entries && Array.isArray(cat.entries)) {
            for (const entry of cat.entries) {
              section += `  - ${entry.name}: ${entry.detail || ''}\n`;
            }
          }
        }
      }
      // Highlights
      if (items.highlights && Array.isArray(items.highlights)) {
        section += `\nDestaques:\n`;
        for (const h of items.highlights) {
          section += `  - ${h.title}: ${h.description || ''} ${h.detail ? '| ' + h.detail : ''}\n`;
        }
      }
      // Impact
      if (items.impact) section += `Impacto: ${items.impact} - ${items.impact_reason || ''}\n`;
    }

    if (context.length + section.length > MAX_CONTEXT) break;
    context += section;
  }

  // FASE 2: Se sobrou espaço, complementa com raw_text dos diários mais recentes
  const remaining = MAX_CONTEXT - context.length;
  if (remaining > 2000) {
    for (const a of analyses) {
      if (!a.raw_text) continue;
      const dateStr = a.edition_date ? new Date(a.edition_date).toISOString().split('T')[0] : 'sem data';
      const header = `\n--- Texto completo Edição ${a.edition || '?'} de ${dateStr} ---\n`;
      const spaceLeft = MAX_CONTEXT - context.length - header.length;
      if (spaceLeft < 1000) break;
      context += header + a.raw_text.substring(0, spaceLeft);
      if (context.length >= MAX_CONTEXT) break;
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await chatWithDeepSeekStream(context, question, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * GET /api/diario/analyses
 */
export async function listAnalyses(_req: Request, res: Response) {
  const analyses = await DiarioAnalysis.findAll({
    order: [['edition_date', 'DESC']],
    limit: 50,
    attributes: ['id', 'edition', 'edition_date', 'summary', 'alerts', 'keywords', 'ai_model', 'created_at'],
  });
  res.json(analyses);
}

/**
 * GET /api/diario/analyses/:id
 */
export async function getAnalysis(req: Request, res: Response) {
  const analysis = await DiarioAnalysis.findByPk(req.params.id);
  if (!analysis) return res.status(404).json({ error: 'Análise não encontrada', code: 'NOT_FOUND' });
  res.json(analysis);
}
