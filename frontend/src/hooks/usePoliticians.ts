import { useQuery } from '@tanstack/react-query';
import { getPoliticians, getPolitician, getPoliticianVotes, getPoliticianRatings } from '../services/politicians';

export function usePoliticians(filters?: Record<string, string>) {
  return useQuery({ queryKey: ['politicians', filters], queryFn: () => getPoliticians(filters) });
}

export function usePolitician(id: number) {
  return useQuery({ queryKey: ['politician', id], queryFn: () => getPolitician(id), enabled: !!id });
}

export function usePoliticianVotes(id: number) {
  return useQuery({ queryKey: ['politician-votes', id], queryFn: () => getPoliticianVotes(id), enabled: !!id });
}

export function usePoliticianRatings(id: number) {
  return useQuery({ queryKey: ['politician-ratings', id], queryFn: () => getPoliticianRatings(id), enabled: !!id });
}
