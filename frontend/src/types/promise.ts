import { Politician } from './politician';

export interface PromiseItem {
  id: number;
  politician_id: number;
  title: string;
  description: string | null;
  area: string | null;
  status: 'pending' | 'progress' | 'done' | 'failed';
  progress_pct: number;
  source_url: string | null;
  deadline: string | null;
  politician?: Politician;
}

export const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  progress: 'Em andamento',
  done: 'Cumprida',
  failed: 'Descumprida',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-gold/20 text-gold',
  progress: 'bg-blue/20 text-blue',
  done: 'bg-green/20 text-green',
  failed: 'bg-red/20 text-red',
};
