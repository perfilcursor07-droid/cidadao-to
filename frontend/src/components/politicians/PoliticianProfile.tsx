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

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = score >= 70 ? '#fff' : score >= 40 ? '#FFF8E1' : score > 0 ? '#FFEBEE' : 'rgba(255,255,255,0.5)';
  return (
    <div className="relative w-[68px] h-[68px] shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
        <motion.circle
          cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          initial={{ strokeDasharray: '0 100' }}
          animate={{ strokeDasharray: `${pct} ${100 - pct}` }}
          transition={{ duration: 1, delay: 0.3, ease: [.22,1,.36,1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white tabular-nums leading-none">{score.toFixed(1)}</span>
        <span className="text-[8px] text-white/60 mt-0.5">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

export default function PoliticianProfile({ politician, votes }: Props) {
  const [showRating, setShowRating] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
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
      className="bg-white border border-border rounded-xl overflow-hidden shadow-card"
    >
      {/* Header verde com tudo dentro */}
      <div className="bg-gradient-to-br from-green-dark via-green to-green-light px-5 py-5 relative overflow-hidden">
        {/* Pattern sutil */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\'%3E%3Cpath d=\'M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E")',
        }} />

        <div className="relative z-10 flex items-center gap-4">
          {/* Foto */}
          {politician.photo_url ? (
            <img
              src={politician.photo_url}
              alt={politician.name}
              className="w-[72px] h-[72px] rounded-2xl object-cover border-[3px] border-white/30 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-2xl bg-white/15 border-[3px] border-white/30 shadow-lg flex items-center justify-center shrink-0 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">{getInitials(politician.name)}</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate leading-tight">{politician.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/15 text-white backdrop-blur-sm">
                {roleLabels[politician.role]}
              </span>
              {politician.party && <span className="text-xs text-white/80 font-medium">{politician.party}</span>}
              {politician.city && <span className="text-xs text-white/55">📍 {politician.city}</span>}
            </div>
            {politician.bio && (
              <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">{politician.bio}</p>
            )}
          </div>

          {/* Score ring */}
          <ScoreRing score={score} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Aprovação', value: score.toFixed(1), color: getScoreColor(score), icon: '📊' },
            { label: 'Votos', value: votes?.total || 0, color: 'text-ink', icon: '🗳️' },
            { label: 'Cumpridas', value: `${done}/${total}`, color: 'text-green', icon: '✅' },
            { label: 'Andamento', value: progress, color: 'text-blue', icon: '🔄' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="bg-surface rounded-xl px-3 py-2.5 text-center"
            >
              <div className="text-xs mb-0.5">{s.icon}</div>
              <div className={`text-base font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Barra de promessas */}
        {total > 0 && (
          <div className="bg-surface rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted font-medium">Progresso das promessas</span>
              <span className="text-[11px] font-bold text-ink tabular-nums">{Math.round((done / total) * 100)}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
              {done > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full bg-green" />}
              {progress > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(progress / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.4 }} className="h-full bg-blue" />}
              {failed > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(failed / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.6 }} className="h-full bg-red" />}
            </div>
            <div className="flex items-center gap-3 mt-2">
              {done > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-green" />{done} cumprida{done > 1 ? 's' : ''}</span>}
              {progress > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-blue" />{progress} andamento</span>}
              {pending > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-gray-300" />{pending} pendente{pending > 1 ? 's' : ''}</span>}
              {failed > 0 && <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-red" />{failed} descumprida{failed > 1 ? 's' : ''}</span>}
            </div>
          </div>
        )}

        {/* Vote bar */}
        {votes && votes.total > 0 && (
          <div className="bg-surface rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2 text-[11px] text-muted">
              <span className="font-medium">Aprovação popular</span>
              <span className="tabular-nums">{votes.total} votos</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <motion.div initial={{ width: 0 }} animate={{ width: `${approvePercent}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-green" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${100 - approvePercent}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-red/25" />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-muted">
              <span>👍 <span className="font-bold text-green">{votes.approve}</span> ({approvePercent.toFixed(0)}%)</span>
              <span>👎 <span className="font-bold text-red">{votes.disapprove}</span> ({(100 - approvePercent).toFixed(0)}%)</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isAuthenticated ? (
          <div className="flex gap-2.5">
            {[
              { key: 'approve', label: 'Aprovar', icon: '👍', onClick: () => handleVote('approve'), bg: 'bg-green', lightBg: 'bg-green/5', border: 'border-green/15', text: 'text-green' },
              { key: 'disapprove', label: 'Reprovar', icon: '👎', onClick: () => handleVote('disapprove'), bg: 'bg-red', lightBg: 'bg-red/5', border: 'border-red/15', text: 'text-red' },
              { key: 'rate', label: 'Avaliar', icon: '⭐', onClick: () => setShowRating(true), bg: 'bg-gold', lightBg: 'bg-gold/5', border: 'border-gold/15', text: 'text-gold' },
            ].map(btn => (
              <motion.button
                key={btn.key}
                onClick={btn.onClick}
                disabled={voteMutation.isPending}
                onHoverStart={() => setHoveredBtn(btn.key)}
                onHoverEnd={() => setHoveredBtn(null)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-40 ${
                  hoveredBtn === btn.key
                    ? `${btn.bg} text-white shadow-md`
                    : `${btn.lightBg} ${btn.text} border ${btn.border}`
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <span className="text-base">{btn.icon}</span>
                  {btn.label}
                </span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue/5 to-accent/5 border border-blue/10 rounded-xl p-3.5 text-center">
            <p className="text-sm text-ink2">
              <a href="/login" className="text-blue font-semibold hover:underline">Faça login</a> para votar e avaliar
            </p>
          </div>
        )}
      </div>

      {showRating && <RatingModal politicianId={politician.id} onClose={() => setShowRating(false)} />}
    </motion.div>
  );
}
