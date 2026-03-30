import api from './api';
import { Politician, PoliticianVotes } from '../types/politician';
import { Rating } from '../types/vote';

export const getPoliticians = (params?: Record<string, string>) =>
  api.get<Politician[]>('/politicians', { params }).then(r => r.data);

export const getPolitician = (id: number) =>
  api.get<Politician>(`/politicians/${id}`).then(r => r.data);

export const getPoliticianVotes = (id: number) =>
  api.get<PoliticianVotes>(`/politicians/${id}/votes`).then(r => r.data);

export const getPoliticianRatings = (id: number) =>
  api.get<Rating[]>(`/politicians/${id}/ratings`).then(r => r.data);
