import { useState } from 'react';
import { Politician, roleLabels } from '../../types/politician';
import { PoliticianVotes } from '../../types/politician';
import ScoreRing from './ScoreRing';
import RatingModal from './RatingModal';
import { useAuth } from '../../hooks/useAuth';
import { useCreateVote } from '../../hooks/useVote';
import { getScoreLabel, getScoreColor } from '../../utils/scoreHelpers';
import { motion } from 'framer-motion';

interface Props {
  politician: Politician;
  votes?: PoliticianVotes;
}

export default function PoliticianProfile({ politician, votes }: Props) {
  const [showRating, setShowRating] = useState(false);
  const { isAuthenticated } = useAuth();
  const voteMutation = useCreateVote();

  const handleVote = (type: 'approve' | 'disapprove') => {
    if (!isAuthenticated) return;
    voteMutation.mutate({ politician_id: politician.id, type });
  };

  const approvePercent = votes && votes.total > 0 ? (votes.approve / votes.total) * 100 : 0;

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Green top bar */}
      <div className="h-1 bg-green" />

      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex flex-col items-center gap-1">
            <ScoreRing score={politician.score} size={90} />
            <span className={`text-xs font-semibold ${getScoreColor(politician.score)}`}>
              {getScoreLabel(politician.score)}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green bg-green/8 px-2 py-0.5 rounded">
                {roleLabels[politician.role] || politician.role}
              </span>
              {politician.party && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-ink2 bg-gray-100 px-2 py-0.5 rounded">
                  {politician.party}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-ink mt-1">{politician.name}</h2>
            {politician.city && <p className="text-sm text-muted mt-0.5">{politician.city}, {politician.state}</p>}
            {politician.bio && <p className="text-sm text-ink2 mt-3 leading-relaxed">{politician.bio}</p>}
          </div>
        </div>

        {/* Vote bar */}
        {votes && votes.total > 0 && (
          <div className="mt-6 bg-surface rounded-lg p-4">
            <div className="flex items-center justify-between mb-2 text-xs text-muted">
              <span className="font-medium">Aprovação popular</span>
              <span>{votes.total} votos</span>
            </div>
            <div className="h-3 bg-red/10 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${approvePercent}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-green rounded-full"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted">
              <span>👍 {votes.approve} ({approvePercent.toFixed(0)}%)</span>
              <span>👎 {votes.disapprove} ({(100 - approvePercent).toFixed(0)}%)</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {isAuthenticated ? (
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => handleVote('approve')} disabled={voteMutation.isPending}
              className="flex-1 min-w-[120px] py-2.5 bg-green/5 text-green border border-green/20 rounded-lg text-sm font-medium hover:bg-green/10 transition-colors">
              👍 Aprovar
            </button>
            <button onClick={() => handleVote('disapprove')} disabled={voteMutation.isPending}
              className="flex-1 min-w-[120px] py-2.5 bg-red/5 text-red border border-red/20 rounded-lg text-sm font-medium hover:bg-red/10 transition-colors">
              👎 Reprovar
            </button>
            <button onClick={() => setShowRating(true)}
              className="flex-1 min-w-[120px] py-2.5 bg-gold/5 text-gold border border-gold/20 rounded-lg text-sm font-medium hover:bg-gold/10 transition-colors">
              ⭐ Avaliar
            </button>
          </div>
        ) : (
          <div className="mt-5 bg-blue/5 border border-blue/10 rounded-lg p-3 text-center">
            <p className="text-sm text-blue"><a href="/login" className="underline font-medium">Faça login</a> para votar e avaliar</p>
          </div>
        )}
      </div>

      {showRating && <RatingModal politicianId={politician.id} onClose={() => setShowRating(false)} />}
    </div>
  );
}
