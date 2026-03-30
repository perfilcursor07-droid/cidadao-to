import api from './api';
import { NewsArticle } from '../types/news';

export const getNews = (params?: Record<string, string>) =>
  api.get<NewsArticle[]>('/news', { params }).then(r => r.data);

export const getArticle = (id: number) =>
  api.get<NewsArticle>(`/news/${id}`).then(r => r.data);
