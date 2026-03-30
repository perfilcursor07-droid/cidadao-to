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

export const getAnalyses = () =>
  api.get<DiarioAnalysis[]>('/diario/analyses').then(r => r.data);

export const getAnalysis = (id: number) =>
  api.get<DiarioAnalysis>(`/diario/analyses/${id}`).then(r => r.data);

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
      const data = JSON.parse(line.slice(6));
      yield data;
    }
  }
}
