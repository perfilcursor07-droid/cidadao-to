import api from './api';

export interface ExpenseItem {
  id: number;
  politician_id: number;
  year: number;
  month: number;
  category: string;
  description: string | null;
  supplier: string | null;
  amount: number;
  source: string;
}

export interface RankingItem {
  politician_id: number;
  name: string;
  party: string;
  role: string;
  photo_url: string | null;
  total: number;
  count: number;
}

export const getExpensesRanking = (year?: number) =>
  api.get<{ year: number; ranking: RankingItem[] }>('/expenses/ranking', { params: year ? { year } : {} }).then(r => r.data);

export const getExpensesSummary = (year?: number) =>
  api.get('/expenses/summary', { params: year ? { year } : {} }).then(r => r.data);

export const getPoliticianExpenses = (id: number, year?: number) =>
  api.get(`/expenses/politician/${id}`, { params: year ? { year } : {} }).then(r => r.data);

export const adminSyncExpenses = (year?: number) =>
  api.post('/admin/expenses/sync', year ? { year } : {}).then(r => r.data);
