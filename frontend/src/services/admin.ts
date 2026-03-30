import api from './api';

export interface AdminStats {
  users: number;
  politicians: number;
  promises: number;
  news: number;
  diarios: number;
  votes: number;
  ratings: number;
}

export const getAdminStats = () =>
  api.get<AdminStats>('/admin/stats').then(r => r.data);

export const getAdminUsers = () =>
  api.get('/admin/users').then(r => r.data);

export const getAdminDiarios = () =>
  api.get('/admin/diario').then(r => r.data);

export const adminFetchDiario = (date: string) =>
  api.post('/admin/diario/fetch', { date }).then(r => r.data);

export const adminDeleteDiario = (id: number) =>
  api.delete(`/admin/diario/${id}`).then(r => r.data);

export const adminSyncPoliticians = () =>
  api.post('/admin/politicians/sync').then(r => r.data);
