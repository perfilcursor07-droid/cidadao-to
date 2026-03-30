import { Request, Response } from 'express';
import { z } from 'zod';
import DiarioAnalysis from '../models/DiarioAnalysis';
import { analyzeWithDeepSeekStream } from '../services/together.service';
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
    fullResponse = await analyzeWithDeepSeekStream(text, (chunk) => {
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
