import api from './api';
import { PromiseItem } from '../types/promise';

export const getPromises = (params?: Record<string, string>) =>
  api.get<PromiseItem[]>('/promises', { params }).then(r => r.data);

export const getPromise = (id: number) =>
  api.get<PromiseItem>(`/promises/${id}`).then(r => r.data);

export const createPromise = (data: Partial<PromiseItem>) =>
  api.post<PromiseItem>('/promises', data).then(r => r.data);

export const updatePromise = (id: number, data: Partial<PromiseItem>) =>
  api.put<PromiseItem>(`/promises/${id}`, data).then(r => r.data);

export const deletePromise = (id: number) =>
  api.delete(`/promises/${id}`).then(r => r.data);
