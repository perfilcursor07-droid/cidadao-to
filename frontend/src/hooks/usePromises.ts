import { useQuery } from '@tanstack/react-query';
import { getPromises, getPromise } from '../services/promises';

export function usePromises(filters?: Record<string, string>) {
  return useQuery({ queryKey: ['promises', filters], queryFn: () => getPromises(filters) });
}

export function usePromise(id: number) {
  return useQuery({ queryKey: ['promise', id], queryFn: () => getPromise(id), enabled: !!id });
}
