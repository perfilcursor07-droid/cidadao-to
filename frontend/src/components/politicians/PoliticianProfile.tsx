import { useState } from 'react';
import { Politician, roleLabels } from '../../types/politician';
import { PoliticianVotes } from '../../types/politician';
import RatingModal from './RatingModal';
import { useAuth } from '../../hooks/useAuth';
import { useCreateVote } from '../../hooks/useVote';
import { getScoreLabel, getScoreColor } from '../../utils/scoreHelpers';
import { motion } from 'framer-motion';

interface Props {
  politician: Politician;
  votes?: PoliticianVotes;
}

const roleBadge: Record<string, string> = {
  governador: 'bg-green/10 text-green',
  senador: 'bg-blue/10 text-blue',
  dep_federal: 'bg-accent/10 text-accent',
  dep_estadual: 'bg-gold/10 text-gold',
  prefeito: 'bg-green/10 text-green',
  vereador: 'bg-gray-100 text-ink2',
};

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function PoliticianProfile({ politician, votes }: Props) {
  const [showRating, setShowRating] = useState(false);
  const { isAuthenticated } = useAuth();
  const voteMutation = useCreateVote();
  const score = Number(politician.score);
  const approvePercent = votes && votes.total > 0 ? (votes.approve / votes.total) * 100 : 0;

  const handleVote = (type: 'approve' | 'disapprove') => {
    if (!isAuthenticated) return;
    voteMutation.mutate({ politician_id: politician.id, type });
  };

  const total = politician.promises_total || 0;
  const done = politician.promises_done || 0;
  const progress = politician.promises_progress || 0;
  const failed = politician.promises_failed || 0;
  const pending = total - done - progress - failed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [.22,1,.36,1] }}
      className="bg-white border border-border rounded-xl overflow-hidden"
    >
      {/* Header compacto — foto + info lado a lado */}
      <div className="bg-gradient-to-r from-green to-green-dark px-5 py-4 flex items-center gap-4">
        {politician.photo_url ? (
          <img
            src={politician.photo_url}
            alt={politician.name}
            className="w-16 h-16 rounded-full object-cover border-[3px] border-white/80 shadow-md shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/20 border-[3px] border-white/80 shadow-md flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-white">{getInitials(politician.name)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{politician.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
              {roleLabels[politician.role]}
            </span>
            {politician.party && <span className="text-xs text-white/75">{politician.party}</span>}
            {politician.city && <span className="text-xs text-white/60">📍 {politician.city}</span>}
          </div>
        </div>
        {/* Score */}
        <div className="text-center shrink-0">
          <div className="text-2xl font-bold text-white tabular-nums leading-none">{score.toFixed(1)}</div>
          <div className="text-[10px] text-white/70 mt-0.5">{getScoreLabel(score)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {politician.bio && (
          <p className="text-sm text-ink2 leading-relaxed">{politician.bio}</p>
        )}

        {/* Stats inline */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Aprovação', value: score.toFixed(1), color: getScoreColor(score) },
            { label: 'Votos', value: votes?.total || 0, color: 'text-ink' },
            { label: 'Cumpridas', value: `${done}/${total}`, color: 'text-green' },
            { label: 'Andamento', value: progress, color: 'text-blue' },
          ].map(s => (
            <div key={s.label} className="bg-surface rounded-lg px-3 py-2 text-center">
              <div className={`text-base font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-muted uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Barra de promessas */}
        {total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted font-medium">Promessas</span>
              <span className="text-[11px] font-bold text-ink">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
              {done > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full bg-green" />}
              {progress > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(progress / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.4 }} className="h-full bg-blue" />}
              {failed > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(failed / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.6 }} className="h-full bg-red" />}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              {done > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-green" />{done} cumprida{done > 1 ? 's' : ''}</span>}
              {progress > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-blue" />{progress} andamento</span>}
              {pending > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />{pending} pendente{pending > 1 ? 's' : ''}</span>}
              {failed > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-red" />{failed} descumprida{failed > 1 ? 's' : ''}</span>}
            </div>
          </div>
        )}

        {/* Vote bar */}
        {votes && votes.total > 0 && (
          <div className="bg-surface rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1.5 text-[11px] text-muted">
              <span className="font-medium">Aprovação popular</span>
              <span>{votes.total} votos</span>
            </div>
            <div className="h-2.5 bg-red/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${approvePercent}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-green rounded-full"
              />
            </div>
            <div className="flex justify-between mt-1 text-[11px] text-muted">
              <span>👍 {votes.approve} ({approvePercent.toFixed(0)}%)</span>
              <span>👎 {votes.disapprove} ({(100 - approvePercent).toFixed(0)}%)</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {isAuthenticated ? (
          <div className="flex gap-2">
            <button onClick={() => handleVote('approve')} disabled={voteMutation.isPending}
              className="flex-1 py-2 bg-green/5 text-green border border-green/20 rounded-lg text-sm font-medium hover:bg-green/10 transition-colors">
              👍 Aprovar
            </button>
            <button onClick={() => handleVote('disapprove')} disabled={voteMutation.isPending}
              className="flex-1 py-2 bg-red/5 text-red border border-red/20 rounded-lg text-sm font-medium hover:bg-red/10 transition-colors">
              👎 Reprovar
            </button>
            <button onClick={() => setShowRating(true)}
              className="flex-1 py-2 bg-gold/5 text-gold border border-gold/20 rounded-lg text-sm font-medium hover:bg-gold/10 transition-colors">
              ⭐ Avaliar
            </button>
          </div>
        ) : (
          <div className="bg-blue/5 border border-blue/10 rounded-lg p-2.5 text-center">
            <p className="text-sm text-blue"><a href="/login" className="underline font-medium">Faça login</a> para votar e avaliar</p>
          </div>
        )}
      </div>

      {showRating && <RatingModal politicianId={politician.id} onClose={() => setShowRating(false)} />}
    </motion.div>
  );
}
