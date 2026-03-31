import api from './api';

export interface DiarioAnalysis {
  id: number;
  edition: string | null;
  edition_date: string | null;
  summary: string | null;
  items: Array<{ title: string; type: string; description: string }>;
  alerts: string[];
  keywords: string[];
  ai_model: string | null;
  created_at: string;
}

export interface FetchResult {
  success: boolean;
  message: string;
  id?: number;
  date?: string;
}

export const getAnalyses = () =>
  api.get<DiarioAnalysis[]>('/diario/analyses').then(r => r.data);

export const getAnalysis = (id: number) =>
  api.get<DiarioAnalysis>(`/diario/analyses/${id}`).then(r => r.data);

/** Dispara o download do Diário Oficial em background (resposta imediata). */
export const triggerFetch = (date?: string) =>
  api.post<{ message: string; date: string }>('/diario/fetch', date ? { date } : {}).then(r => r.data);

/** Dispara o download e aguarda o resultado completo. */
export const triggerFetchSync = (date?: string) =>
  api.post<FetchResult>('/diario/fetch/sync', date ? { date } : {}).then(r => r.data);

export async function* streamAnalysis(text: string) {
  const response = await fetch(
    (import.meta.env.VITE_API_URL || '/api') + '/diario/analyze',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  );

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        yield data;
      } catch {
        // ignora linhas malformadas
      }
    }
  }
}


export async function* streamChat(question: string) {
  const response = await fetch(
    (import.meta.env.VITE_API_URL || '/api') + '/diario/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    yield { error: err.error || 'Erro ao consultar IA' };
    return;
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        yield data;
      } catch {}
    }
  }
}
