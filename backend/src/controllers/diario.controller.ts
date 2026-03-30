import { Request, Response } from 'express';
import { z } from 'zod';
import { anthropic } from '../config/anthropic';
import DiarioAnalysis from '../models/DiarioAnalysis';

const analyzeSchema = z.object({
  text: z.string().min(10),
});

export async function analyze(req: Request, res: Response) {
  const { text } = analyzeSchema.parse(req.body);

  if (!anthropic) {
    return res.status(503).json({ error: 'Serviço de IA não configurado', code: 'AI_UNAVAILABLE' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Analise o seguinte trecho do Diário Oficial do Tocantins. Retorne um JSON com:
- "summary": resumo geral em português
- "items": array de objetos com "title", "type" (nomeação, licitação, decreto, portaria, contrato, outro), "description"
- "alerts": array de itens que merecem atenção especial do cidadão
- "keywords": array de palavras-chave relevantes

Texto do Diário Oficial:
${text}`,
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    // Save analysis
    let parsed: any = {};
    try {
      parsed = JSON.parse(fullResponse);
    } catch {
      parsed = { summary: fullResponse, items: [], alerts: [], keywords: [] };
    }

    await DiarioAnalysis.create({
      raw_text: text,
      summary: parsed.summary || '',
      items: parsed.items || [],
      alerts: parsed.alerts || [],
      keywords: parsed.keywords || [],
      ai_model: 'claude-sonnet-4-20250514',
      edition_date: new Date(),
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

export async function listAnalyses(_req: Request, res: Response) {
  const analyses = await DiarioAnalysis.findAll({ order: [['created_at', 'DESC']], limit: 50 });
  res.json(analyses);
}

export async function getAnalysis(req: Request, res: Response) {
  const analysis = await DiarioAnalysis.findByPk(req.params.id);
  if (!analysis) return res.status(404).json({ error: 'Análise não encontrada', code: 'NOT_FOUND' });
  res.json(analysis);
}
