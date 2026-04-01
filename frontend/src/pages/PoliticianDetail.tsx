import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePolitician, usePoliticianVotes } from '../hooks/usePoliticians';
import { usePromises } from '../hooks/usePromises';
import { useAuth } from '../hooks/useAuth';
import { useCreateVote } from '../hooks/useVote';
import { roleLabels } from '../types/politician';
import { getScoreColor, getScoreLabel } from '../utils/scoreHelpers';
import PromiseCard from '../components/promises/PromiseCard';
import RatingModal from '../components/politicians/RatingModal';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [.22, 1, .36, 1] } },
};

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function PoliticianDetail() {
  const { id } = useParams<{ id: string }>();
  const politicianId = Number(id);
  const { data: politician, isLoading } = usePolitician(politicianId);
  const { data: votes } = usePoliticianVotes(politicianId);
  const { data: promises } = usePromises({ politician_id: String(politicianId) });
  const { isAuthenticated } = useAuth();
  const voteMutation = useCreateVote();
  const [showRating, setShowRating] = useState(false);
  const [promiseFilter, setPromiseFilter] = useState<string>('all');

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-green border-t-transparent rounded-full" />
    </div>
  );

  if (!politician) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-ink font-medium mb-1">Político não encontrado</p>
      <Link to="/politicians" className="text-green text-sm hover:underline">← Voltar para lista</Link>
    </div>
  );

  const score = Number(politician.score);
  const approvePercent = votes && votes.total > 0 ? (votes.approve / votes.total) * 100 : 0;
  const total = politician.promises_total || 0;
  const done = politician.promises_done || 0;
  const progress = politician.promises_progress || 0;
  const failed = politician.promises_failed || 0;
  const pending = total - done - progress - failed;

  const handleVote = (type: 'approve' | 'disapprove') => {
    if (!isAuthenticated) return;
    voteMutation.mutate({ politician_id: politician.id, type });
  };

  const filteredPromises = promises?.filter(p => promiseFilter === 'all' ? true : p.status === promiseFilter) || [];
  const promiseCounts = {
    all: promises?.length || 0,
    done: promises?.filter(p => p.status === 'done').length || 0,
    progress: promises?.filter(p => p.status === 'progress').length || 0,
    pending: promises?.filter(p => p.status === 'pending').length || 0,
    failed: promises?.filter(p => p.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-xs text-muted">
        <Link to="/politicians" className="hover:text-green transition-colors">Políticos</Link>
        <span>/</span>
        <span className="text-ink font-medium">{politician.name}</span>
      </motion.nav>

      {/* Hero - Perfil do Político */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-border rounded-2xl overflow-hidden shadow-card"
      >
        {/* Banner verde */}
        <div className="bg-gradient-to-br from-green-dark via-green to-green-light h-32 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\'%3E%3Cpath d=\'M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>

        {/* Conteúdo do perfil */}
        <div className="px-5 sm:px-8 pb-6 relative">
          {/* Foto flutuando sobre o banner */}
          <div className="-mt-14 mb-4 flex items-end justify-between">
            {politician.photo_url ? (
              <img
                src={politician.photo_url}
                alt={politician.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-lg flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-muted">{getInitials(politician.name)}</span>
              </div>
            )}

            {/* Score no canto */}
            <div className="flex items-center gap-3 pb-1">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-muted uppercase tracking-wide font-medium">Aprovação</div>
                <div className={`text-xs font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${
                score >= 70 ? 'bg-green/10' : score >= 40 ? 'bg-gold/10' : 'bg-red/10'
              }`}>
                <span className={`text-2xl font-bold tabular-nums leading-none ${getScoreColor(score)}`}>
                  {score.toFixed(0)}
                </span>
                <span className="text-[8px] text-muted mt-0.5">/ 100</span>
              </div>
            </div>
          </div>

          {/* Nome e info — agora claramente no fundo branco */}
          <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight">{politician.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-green/10 text-green">
              {roleLabels[politician.role]}
            </span>
            {politician.party && (
              <span className="text-xs text-ink2 font-medium bg-surface px-2 py-0.5 rounded-md">{politician.party}</span>
            )}
            {politician.city && (
              <span className="text-xs text-muted flex items-center gap-1">📍 {politician.city}</span>
            )}
          </div>

          {/* Bio */}
          {politician.bio && (
            <p className="text-sm text-ink2 mt-3 leading-relaxed max-w-2xl">{politician.bio}</p>
          )}
        </div>
      </motion.div>

      {/* Grid principal: Stats + Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna esquerda: Stats e Promessas */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cards de estatísticas */}
          <motion.div
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { label: 'Aprovação', value: score.toFixed(1), sub: getScoreLabel(score), color: getScoreColor(score), icon: '📊' },
              { label: 'Votos', value: votes?.total || 0, sub: 'total de votos', color: 'text-ink', icon: '🗳️' },
              { label: 'Cumpridas', value: `${done}/${total}`, sub: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%', color: 'text-green', icon: '✅' },
              { label: 'Em andamento', value: progress, sub: `de ${total} promessas`, color: 'text-blue', icon: '🔄' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="bg-white border border-border rounded-xl p-4 hover:shadow-card transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wide font-medium">{s.label}</span>
                </div>
                <div className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted mt-0.5">{s.sub}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Barra de aprovação popular */}
          {votes && votes.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-ink">Aprovação Popular</h3>
                <span className="text-xs text-muted tabular-nums">{votes.total} votos</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${approvePercent}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-green rounded-l-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - approvePercent}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-red/20 rounded-r-full"
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted">
                  👍 <span className="font-bold text-green">{votes.approve}</span> aprovam ({approvePercent.toFixed(0)}%)
                </span>
                <span className="text-xs text-muted">
                  👎 <span className="font-bold text-red">{votes.disapprove}</span> reprovam ({(100 - approvePercent).toFixed(0)}%)
                </span>
              </div>
            </motion.div>
          )}

          {/* Progresso das promessas */}
          {total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-border rounded-xl p-5"
            >
              <h3 className="text-sm font-bold text-ink mb-3">Progresso das Promessas</h3>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex mb-3">
                {done > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full bg-green" />}
                {progress > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(progress / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.4 }} className="h-full bg-blue" />}
                {failed > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(failed / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.6 }} className="h-full bg-red" />}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Cumpridas', value: done, color: 'bg-green', textColor: 'text-green' },
                  { label: 'Em andamento', value: progress, color: 'bg-blue', textColor: 'text-blue' },
                  { label: 'Pendentes', value: pending, color: 'bg-gray-300', textColor: 'text-muted' },
                  { label: 'Descumpridas', value: failed, color: 'bg-red', textColor: 'text-red' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    <div>
                      <div className={`text-sm font-bold tabular-nums ${item.textColor}`}>{item.value}</div>
                      <div className="text-[9px] text-muted">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Promessas de Campanha — dentro da coluna esquerda */}
          {promises && promises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="text-base font-bold text-ink">Promessas de Campanha</h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: 'all', label: 'Todas', count: promiseCounts.all },
                    { key: 'done', label: 'Cumpridas', count: promiseCounts.done },
                    { key: 'progress', label: 'Andamento', count: promiseCounts.progress },
                    { key: 'pending', label: 'Pendentes', count: promiseCounts.pending },
                    { key: 'failed', label: 'Descumpridas', count: promiseCounts.failed },
                  ].filter(f => f.key === 'all' || f.count > 0).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setPromiseFilter(f.key)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all ${
                        promiseFilter === f.key ? 'bg-green text-white' : 'bg-surface text-muted hover:bg-gray-200'
                      }`}
                    >
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>
              </div>
              <motion.div
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                initial="hidden"
                animate="visible"
                className="space-y-3"
                key={promiseFilter}
              >
                {filteredPromises.map(p => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <PromiseCard promise={p} />
                  </motion.div>
                ))}
              </motion.div>
              {filteredPromises.length === 0 && (
                <div className="text-center py-6 text-muted text-sm">Nenhuma promessa com este filtro.</div>
              )}
            </motion.div>
          )}
        </div>

        {/* Coluna direita: Ações */}
        <div className="space-y-5">
          {/* Card de ações */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-border rounded-xl p-5 sticky top-20"
          >
            <h3 className="text-sm font-bold text-ink mb-4">Sua opinião</h3>

            {isAuthenticated ? (
              <div className="space-y-3">
                <button
                  onClick={() => handleVote('approve')}
                  disabled={voteMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-green/20 bg-green/5 hover:bg-green hover:text-white text-green transition-all duration-200 disabled:opacity-40 group"
                >
                  <span className="text-xl">👍</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Aprovar</div>
                    <div className="text-[10px] opacity-70 group-hover:opacity-90">Apoio este político</div>
                  </div>
                </button>

                <button
                  onClick={() => handleVote('disapprove')}
                  disabled={voteMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red/20 bg-red/5 hover:bg-red hover:text-white text-red transition-all duration-200 disabled:opacity-40 group"
                >
                  <span className="text-xl">👎</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Reprovar</div>
                    <div className="text-[10px] opacity-70 group-hover:opacity-90">Não apoio este político</div>
                  </div>
                </button>

                <div className="border-t border-border pt-3">
                  <button
                    onClick={() => setShowRating(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gold/20 bg-gold/5 hover:bg-gold hover:text-white text-gold transition-all duration-200 group"
                  >
                    <span className="text-xl">⭐</span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">Avaliar detalhado</div>
                      <div className="text-[10px] opacity-70 group-hover:opacity-90">Presença, transparência e mais</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🗳️</div>
                <p className="text-sm text-ink2 mb-3">Faça login para votar e avaliar este político</p>
                <Link
                  to="/login"
                  className="inline-block bg-green text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-green-dark transition-colors"
                >
                  Entrar
                </Link>
              </div>
            )}
          </motion.div>

          {/* Resumo rápido de promessas */}
          {total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-border rounded-xl overflow-hidden"
            >
              <div className="bg-green/5 border-b border-border px-5 py-3">
                <h3 className="text-sm font-bold text-ink">Resumo</h3>
              </div>
              <div className="p-5">
                <div className="text-center mb-4 pb-4 border-b border-border">
                  <div className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>
                    {total > 0 ? Math.round((done / total) * 100) : 0}%
                  </div>
                  <div className="text-[11px] text-muted mt-1">Taxa de cumprimento</div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Total', value: total, color: 'text-ink' },
                    { label: 'Cumpridas', value: done, color: 'text-green', dot: 'bg-green' },
                    { label: 'Em andamento', value: progress, color: 'text-blue', dot: 'bg-blue' },
                    { label: 'Pendentes', value: pending, color: 'text-muted', dot: 'bg-gray-300' },
                    { label: 'Descumpridas', value: failed, color: 'text-red', dot: 'bg-red' },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-xs text-muted">
                        {s.dot && <span className={`w-2 h-2 rounded-full ${s.dot}`} />}
                        {s.label}
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showRating && <RatingModal politicianId={politician.id} onClose={() => setShowRating(false)} />}
    </div>
  );
}
