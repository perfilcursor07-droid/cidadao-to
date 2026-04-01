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

export const adminFetchPhotos = () =>
  api.post('/admin/politicians/photos/sync').then(r => r.data);

export const adminSearchPhoto = (name: string, role: string) =>
  api.post<{ found: boolean; photo_url: string | null }>('/admin/politicians/photos/search', { name, role }).then(r => r.data);

export const adminResetPoliticians = () =>
  api.post('/admin/politicians/reset').then(r => r.data);

export const adminResearchPromises = (politicianId: number) =>
  api.post(`/admin/promises/research/${politicianId}`).then(r => r.data);

export const adminResearchAllPromises = () =>
  api.post('/admin/promises/research-all').then(r => r.data);

export const adminUpdatePromisesStatus = () =>
  api.post('/admin/promises/update-status').then(r => r.data);

export const adminResetPromises = () =>
  api.post('/admin/promises/reset').then(r => r.data);
