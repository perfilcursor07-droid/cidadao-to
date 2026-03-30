import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVote, updateVote, deleteVote } from '../services/votes';

export function useCreateVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVote,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['politician-votes'] }); },
  });
}

export function useUpdateVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'approve' | 'disapprove' }) => updateVote(id, { type }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['politician-votes'] }); },
  });
}

export function useDeleteVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVote,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['politician-votes'] }); },
  });
}
