export function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatScore(score: number) {
  return Number(score).toFixed(1);
}

export function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}
