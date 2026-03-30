import { anthropic } from '../config/anthropic';

export async function analyzeText(text: string) {
  if (!anthropic) throw new Error('Anthropic não configurado');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Analise o seguinte texto do Diário Oficial do Tocantins e retorne um JSON estruturado com summary, items, alerts e keywords:\n\n${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    try {
      return JSON.parse(content.text);
    } catch {
      return { summary: content.text, items: [], alerts: [], keywords: [] };
    }
  }
  return null;
}
