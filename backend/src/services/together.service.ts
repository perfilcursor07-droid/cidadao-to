import axios from 'axios';
import { env } from '../config/env';

const TOGETHER_BASE_URL = 'https://api.together.xyz/v1';
const MODEL = 'deepseek-ai/DeepSeek-V3.1';

const PROMPT_TEMPLATE = (text: string) => `Você é um assistente especializado em simplificar textos do Diário Oficial para cidadãos comuns. Analise o seguinte trecho do Diário Oficial do Tocantins e retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem blocos de código.

O JSON deve ter exatamente esta estrutura:
{
  "summary": "resumo geral em linguagem simples e direta para o cidadão comum",
  "items": [
    {
      "title": "título do item",
      "type": "nomeação|licitação|decreto|portaria|contrato|outro",
      "description": "explicação simples do que significa para o cidadão"
    }
  ],
  "alerts": ["item importante 1", "item importante 2"],
  "keywords": ["palavra1", "palavra2"]
}

Regras:
- Use linguagem simples, evite termos jurídicos sem explicação
- Destaque em "alerts" apenas itens que afetam diretamente o cidadão (saúde, educação, obras, impostos, serviços públicos)
- Seja objetivo e conciso

Texto do Diário Oficial:
${text}`;

export async function analyzeWithDeepSeek(text: string): Promise<string> {
  const response = await axios.post(
    `${TOGETHER_BASE_URL}/chat/completions`,
    {
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: PROMPT_TEMPLATE(text),
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );

  return response.data.choices[0].message.content as string;
}

export async function analyzeWithDeepSeekStream(
  text: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await axios.post(
    `${TOGETHER_BASE_URL}/chat/completions`,
    {
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      stream: true,
      messages: [
        {
          role: 'user',
          content: PROMPT_TEMPLATE(text),
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 120000,
    }
  );

  return new Promise((resolve, reject) => {
    let fullText = '';

    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter((l: string) => l.trim());
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // ignore parse errors on stream lines
        }
      }
    });

    response.data.on('end', () => resolve(fullText));
    response.data.on('error', reject);
  });
}
