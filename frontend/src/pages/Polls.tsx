import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PageTitle from '../components/shared/PageTitle';
import { motion } from 'framer-motion';

interface PollOption { text: string; votes: number; pct: number }
interface PollData { id: number; title: string; description: string | null; options: PollOption[]; totalVotes: number; active: boolean; ends_at: string | null }

export default function Polls() {
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: () => api.get('/polls').then(r => r.data),
  });

  return (
    <div>
      <PageTitle title="Enquetes" subtitle="Dê sua opinião sobre temas importantes do Tocantins" />
      {isLoading ? (
        <div className="text-center py-16 text-muted text-sm">Carregando...</div>
      ) : polls.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm text-muted">Nenhuma enquete disponível no momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((p: PollData) => <PollCard key={p.id} poll={p} />)}
        </div>
      )}
    </div>
  );
}

function PollCard({ poll }: { poll: PollData }) {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState<number | null>(null);

  // Verifica se já votou
  const { data: myVote } = useQuery({
    queryKey: ['poll-vote', poll.id],
    queryFn: () => api.get(`/polls/${poll.id}/my-vote`).then(r => r.data),
    enabled: isAuthenticated,
  });

  const hasVoted = myVote?.voted || voted !== null;
  const selectedOption = myVote?.option_index ?? voted;

  const handleVote = async (optionIndex: number) => {
    if (!isAuthenticated || hasVoted || voting) return;
    setVoting(true);
    try {
      await api.post(`/polls/${poll.id}/vote`, { option_index: optionIndex });
      setVoted(optionIndex);
      qc.invalidateQueries({ queryKey: ['polls'] });
      qc.invalidateQueries({ queryKey: ['poll-vote', poll.id] });
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao votar');
    }
    setVoting(false);
  };

  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="p-5">
        <h3 className="text-base font-bold text-ink">{poll.title}</h3>
        {poll.description && <p className="text-sm text-muted mt-1">{poll.description}</p>}

        <div className="mt-4 space-y-2">
          {poll.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            return (
              <button
                key={i}
                onClick={() => handleVote(i)}
                disabled={hasVoted || voting || !isAuthenticated}
                className={`w-full text-left rounded-xl border p-3 transition-all relative overflow-hidden ${
                  isSelected ? 'border-green bg-green/5' :
                  hasVoted ? 'border-border bg-surface cursor-default' :
                  'border-border hover:border-green/30 hover:bg-green/3 cursor-pointer'
                }`}
              >
                {/* Barra de resultado */}
                {hasVoted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${opt.pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`absolute inset-y-0 left-0 ${isSelected ? 'bg-green/10' : 'bg-gray-100'} rounded-xl`}
                  />
                )}
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-green bg-green' : 'border-border'
                    }`}>
                      {isSelected && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className={`text-sm ${isSelected ? 'font-bold text-ink' : 'text-ink2'}`}>{opt.text}</span>
                  </div>
                  {hasVoted && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted tabular-nums">{opt.votes}</span>
                      <span className={`text-xs font-bold tabular-nums ${isSelected ? 'text-green' : 'text-muted'}`}>{opt.pct}%</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3 text-[11px] text-muted">
          <span>{poll.totalVotes} voto{poll.totalVotes !== 1 ? 's' : ''}</span>
          {!isAuthenticated && <span className="text-blue"><a href="/login" className="underline">Faça login</a> para votar</span>}
          {hasVoted && <span className="text-green font-medium">✓ Você votou</span>}
        </div>
      </div>
    </div>
  );
}
