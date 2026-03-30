import api from './api';
import { Vote, Rating } from '../types/vote';

export const createVote = (data: { politician_id: number; type: 'approve' | 'disapprove' }) =>
  api.post<Vote>('/votes', data).then(r => r.data);

export const updateVote = (id: number, data: { type: 'approve' | 'disapprove' }) =>
  api.put<Vote>(`/votes/${id}`, data).then(r => r.data);

export const deleteVote = (id: number) =>
  api.delete(`/votes/${id}`);

export const createRating = (data: {
  politician_id: number;
  attendance: number;
  project_quality: number;
  transparency: number;
  communication: number;
}) => api.post<Rating>('/ratings', data).then(r => r.data);

export const updateRating = (id: number, data: {
  attendance: number;
  project_quality: number;
  transparency: number;
  communication: number;
}) => api.put<Rating>(`/ratings/${id}`, data).then(r => r.data);
