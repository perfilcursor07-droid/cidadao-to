export interface Politician {
  id: number;
  name: string;
  role: 'governador' | 'senador' | 'dep_federal' | 'dep_estadual' | 'prefeito' | 'vereador';
  party: string | null;
  city: string | null;
  state: string;
  bio: string | null;
  photo_url: string | null;
  tse_id: string | null;
  score: number;
  total_votes: number;
  active: boolean;
  promises_total?: number;
  promises_done?: number;
  promises_progress?: number;
  promises_failed?: number;
}

export interface PoliticianVotes {
  total: number;
  approve: number;
  disapprove: number;
}

export const roleLabels: Record<string, string> = {
  governador: 'Governador',
  senador: 'Senador',
  dep_federal: 'Dep. Federal',
  dep_estadual: 'Dep. Estadual',
  prefeito: 'Prefeito(a)',
  vereador: 'Vereador(a)',
};
