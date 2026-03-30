export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green';
  if (score >= 40) return 'text-gold';
  return 'text-red';
}

export function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-green';
  if (score >= 40) return 'bg-gold';
  return 'bg-red';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  if (score >= 20) return 'Ruim';
  return 'Sem avaliação';
}
