import axios from 'axios';
import { env } from '../config/env';

const TOGETHER_BASE_URL = 'https://api.together.xyz/v1';
const MODEL = 'deepseek-ai/DeepSeek-V3.1';

const PROMPT_TEMPLATE = (text: string) => `Você é um analista do Diário Oficial do Tocantins. Sua tarefa é ler o texto e retornar um JSON COMPLETO e DETALHADO.

VOCÊ DEVE retornar APENAS JSON válido. Sem texto antes ou depois. Sem markdown.

JSON obrigatório:
{
  "summary": "resumo geral em 2-3 frases, linguagem simples",
  "impact": "positivo",
  "impact_reason": "razão do impacto",
  "categories": [
    {
      "name": "Nomeações",
      "count": 12,
      "description": "12 servidores nomeados para cargos públicos",
      "entries": [
        {"name": "Fulano de Tal", "detail": "Nomeado para cargo X no órgão Y"}
      ]
    },
    {
      "name": "Exonerações",
      "count": 5,
      "description": "5 servidores exonerados",
      "entries": [
        {"name": "Ciclano", "detail": "Exonerado do cargo X"}
      ]
    }
  ],
  "highlights": [
    {
      "title": "Reajuste salarial para bombeiros",
      "description": "Aumento nos salários dos bombeiros militares",
      "impact": "positivo",
      "detail": "Explicação completa com valores, datas e quem é afetado"
    }
  ],
  "alerts": ["alerta 1"],
  "keywords": ["palavra1", "palavra2"]
}

REGRAS OBRIGATÓRIAS:
1. "categories" DEVE existir e DEVE conter TODAS as categorias encontradas no texto. Categorias possíveis: Nomeações, Exonerações, Contratos Extintos, Licitações, Decretos, Portarias, Reajustes Salariais, Convênios, Medidas Provisórias. Inclua APENAS as que aparecem no texto.
2. Cada categoria DEVE ter "entries" com CADA pessoa/item individual listado. Se há 12 nomeações, liste as 12.
3. "count" DEVE ser o número exato de entries.
4. "highlights" DEVE conter os pontos PRINCIPAIS que afetam o cidadão: reajustes, mudanças em serviços, obras, licitações grandes. NÃO coloque nomeações/exonerações em highlights.
5. Cada highlight DEVE ter "detail" com informação completa.
6. "impact" geral: "positivo" se beneficia a população, "negativo" se prejudica, "neutro" se só administrativo.
7. Linguagem SIMPLES. Qualquer pessoa deve entender.
8. O JSON DEVE ser completo. Não corte ou resuma demais.

Texto do Diário Oficial:
${text}`;

const CHAT_PROMPT = (context: string, question: string) => `Você é um assistente especializado no Diário Oficial do Tocantins. Responda a pergunta do cidadão com base APENAS no conteúdo dos diários oficiais fornecidos abaixo.

REGRAS OBRIGATÓRIAS:
1. Responda em português, linguagem simples e direta.
2. Se a informação não estiver nos diários, diga claramente: "Não encontrei essa informação nos diários disponíveis."
3. SEMPRE cite a edição e data quando mencionar informações.
4. Escreva nomes completos de pessoas e cargos — NUNCA corte ou abrevie nomes.
5. Use listas numeradas quando listar múltiplos itens.
6. NÃO use markdown com ** para negrito. Escreva texto simples.
7. Seja completo mas conciso. Não repita informações.
8. Se houver vários resultados, liste TODOS com detalhes completos.

Conteúdo dos Diários Oficiais disponíveis:
${context}

Pergunta do cidadão: ${question}`;

export async function chatWithDeepSeekStream(
  context: string,
  question: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await axios.post(
    `${TOGETHER_BASE_URL}/chat/completions`,
    {
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.4,
      stream: true,
      messages: [
        { role: 'user', content: CHAT_PROMPT(context, question) },
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
          if (delta) { fullText += delta; onChunk(delta); }
        } catch {}
      }
    });
    response.data.on('end', () => resolve(fullText));
    response.data.on('error', reject);
  });
}

export async function analyzeWithDeepSeek(text: string): Promise<string> {
  const response = await axios.post(
    `${TOGETHER_BASE_URL}/chat/completions`,
    {
      model: MODEL,
      max_tokens: 8192,
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
      max_tokens: 8192,
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
