import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePromises } from '../hooks/usePromises';
import PromiseCard from '../components/promises/PromiseCard';
import { PromiseItem } from '../types/promise';

const statuses = ['', 'pending', 'progress', 'done', 'failed'];
const labels: Record<string, string> = { '': 'Todas', pending: 'Pendentes', progress: 'Andamento', done: 'Cumpridas', failed: 'Descumpridas' };
const statusDot: Record<string, string> = { pending: 'bg-gold', progress: 'bg-blue', done: 'bg-green', failed: 'bg-red' };

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

interface PoliticianGroup {
  id: number;
  name: string;
  party: string;
  photo_url: string | null;
  promises: PromiseItem[];
  done: number;
  progress: number;
  pending: number;
  failed: number;
}

export default function Promises() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expandedPol, setExpandedPol] = useState<number | null>(null);

  const filters: Record<string, string> = {};
  if (status) filters.status = status;
  const { data: promises, isLoading } = usePromises(filters);

  // Agrupar por político
  const grouped = useMemo(() => {
    if (!promises) return [];
    const map = new Map<number, PoliticianGroup>();
    for (const p of promises) {
      const pol = (p as any).politician;
      const id = p.politician_id;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: pol?.name || `Político #${id}`,
          party: pol?.party || '',
          photo_url: pol?.photo_url || null,
          promises: [],
          done: 0, progress: 0, pending: 0, failed: 0,
        });
      }
      const g = map.get(id)!;
      g.promises.push(p);
      if (p.status === 'done') g.done++;
      else if (p.status === 'progress') g.progress++;
      else if (p.status === 'failed') g.failed++;
      else g.pending++;
    }
    return Array.from(map.values()).sort((a, b) => b.promises.length - a.promises.length);
  }, [promises]);

  // Filtrar por busca
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.promises.some(p => p.title.toLowerCase().includes(q) || p.area?.toLowerCase().includes(q))
    );
  }, [grouped, search]);

  // Totais gerais
  const totalAll = promises?.length || 0;
  const doneAll = promises?.filter(p => p.status === 'done').length || 0;
  const progressAll = promises?.filter(p => p.status === 'progress').length || 0;
  const pendingAll = promises?.filter(p => p.status === 'pending').length || 0;
  const failedAll = promises?.filter(p => p.status === 'failed').length || 0;
  const rateAll = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-ink">Promessas de Campanha</h1>
        <p className="text-sm text-muted mt-0.5">Monitore o cumprimento das promessas dos políticos tocantinenses</p>
      </motion.div>

      {/* Stats gerais */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-5 flex-wrap">
          {/* Donut */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#f0f0f0" strokeWidth="3" />
              {doneAll > 0 && <circle cx="18" cy="18" r="14" fill="none" stroke="#00A335" strokeWidth="3"
                strokeDasharray={`${(doneAll / totalAll) * 100} ${100 - (doneAll / totalAll) * 100}`} strokeLinecap="round" />}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-ink tabular-nums">{rateAll}%</span>
            </div>
          </div>
          {/* Números */}
          <div className="flex-1 grid grid-cols-4 gap-3">
            {[
              { label: 'Cumpridas', value: doneAll, color: 'text-green', dot: 'bg-green' },
              { label: 'Andamento', value: progressAll, color: 'text-blue', dot: 'bg-blue' },
              { label: 'Pendentes', value: pendingAll, color: 'text-gold', dot: 'bg-gold' },
              { label: 'Descumpridas', value: failedAll, color: 'text-red', dot: 'bg-red' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span className="text-[10px] text-muted">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-ink tabular-nums">{totalAll}</div>
            <div className="text-[10px] text-muted">total</div>
          </div>
        </div>
      </motion.div>

      {/* Busca + filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar político ou promessa..."
          className="flex-1 min-w-[200px] bg-white border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/20 placeholder:text-muted/50"
        />
        <div className="flex gap-1.5">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                status === s
                  ? 'bg-green text-white shadow-sm'
                  : 'bg-white border border-border text-muted hover:text-ink hover:border-green/20'
              }`}>
              {s && <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot[s]} mr-1.5`} />}
              {labels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada por político */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Carregando promessas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-muted">Nenhuma promessa encontrada.</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {filtered.map(g => {
            const total = g.promises.length;
            const rate = total > 0 ? Math.round((g.done / total) * 100) : 0;
            const isOpen = expandedPol === g.id;

            return (
              <motion.div key={g.id} variants={fadeUp} className="bg-white border border-border rounded-xl overflow-hidden">
                {/* Político header */}
                <button
                  onClick={() => setExpandedPol(isOpen ? null : g.id)}
                  className="w-full text-left px-4 py-3.5 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Foto */}
                    {g.photo_url ? (
                      <img src={g.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-muted text-xs font-bold shrink-0">
                        {g.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink truncate">{g.name}</span>
                        {g.party && <span className="text-[10px] text-muted">{g.party}</span>}
                      </div>
                      {/* Mini progress bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex max-w-[200px]">
                          {g.done > 0 && <div className="h-full bg-green" style={{ width: `${(g.done / total) * 100}%` }} />}
                          {g.progress > 0 && <div className="h-full bg-blue" style={{ width: `${(g.progress / total) * 100}%` }} />}
                          {g.failed > 0 && <div className="h-full bg-red" style={{ width: `${(g.failed / total) * 100}%` }} />}
                        </div>
                        <span className="text-[10px] text-muted tabular-nums">{rate}%</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {g.done > 0 && <span className="text-[10px] bg-green/10 text-green font-bold px-1.5 py-0.5 rounded tabular-nums">{g.done} ✓</span>}
                      {g.progress > 0 && <span className="text-[10px] bg-blue/10 text-blue font-bold px-1.5 py-0.5 rounded tabular-nums">{g.progress} ⟳</span>}
                      {g.pending > 0 && <span className="text-[10px] bg-gold/10 text-gold font-bold px-1.5 py-0.5 rounded tabular-nums">{g.pending} ⏳</span>}
                      {g.failed > 0 && <span className="text-[10px] bg-red/10 text-red font-bold px-1.5 py-0.5 rounded tabular-nums">{g.failed} ✗</span>}
                      <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded tabular-nums">{total}</span>
                    </div>

                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted text-xs shrink-0 ml-1"
                    >▼</motion.span>
                  </div>
                </button>

                {/* Promessas expandidas */}
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">{total} promessa{total > 1 ? 's' : ''}</span>
                        <Link to={`/politicians/${g.id}`} className="text-xs text-green font-medium hover:underline">
                          Ver perfil →
                        </Link>
                      </div>
                      {g.promises.map(p => <PromiseCard key={p.id} promise={p} />)}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
