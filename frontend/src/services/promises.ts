import api from './api';
import { PromiseItem } from '../types/promise';

export const getPromises = (params?: Record<string, string>) =>
  api.get<PromiseItem[]>('/promises', { params }).then(r => r.data);

export const getPromise = (id: number) =>
  api.get<PromiseItem>(`/promises/${id}`).then(r => r.data);
