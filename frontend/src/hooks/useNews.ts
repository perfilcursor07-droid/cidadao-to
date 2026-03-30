import { useQuery } from '@tanstack/react-query';
import { getNews, getArticle } from '../services/news';

export function useNews(filters?: Record<string, string>) {
  return useQuery({ queryKey: ['news', filters], queryFn: () => getNews(filters) });
}

export function useArticle(id: number) {
  return useQuery({ queryKey: ['article', id], queryFn: () => getArticle(id), enabled: !!id });
}
