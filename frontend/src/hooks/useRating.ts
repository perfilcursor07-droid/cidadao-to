import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRating, updateRating } from '../services/votes';

export function useCreateRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRating,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['politician-ratings'] }); },
  });
}

export function useUpdateRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; attendance: number; project_quality: number; transparency: number; communication: number }) =>
      updateRating(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['politician-ratings'] }); },
  });
}
