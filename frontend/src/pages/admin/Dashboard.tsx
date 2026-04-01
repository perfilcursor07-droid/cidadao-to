import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../services/admin';
import { useNews } from '../../hooks/useNews';
import { usePoliticians } from '../../hooks/usePoliticians';
import { usePromises } from '../../hooks/usePromises';

/* ── Animated counter ── */
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || value === 0) { setDisplay(value); return; }
    started.current = true;
    let start = 0;
    const duration = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span ref={ref}>{display.toLocaleString('pt-BR')}</span>;
}

/* ── Sparkline mini chart ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="opacity-40">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [.22, 1, .36, 1] } },
};

const statCards = [
  { key: 'users', label: 'Usuários', icon: '👥', accent: '#3b82f6', spark: [2, 5, 3, 8, 6, 12, 9] },
  { key: 'politicians', label: 'Políticos', icon: '🏛️', accent: '#00A335', spark: [15, 15, 15, 15, 15, 15, 15] },
  { key: 'promises', label: 'Promessas', icon: '📋', accent: '#E6A817', spark: [4, 8, 12, 18, 22, 28, 35] },
  { key: 'news', label: 'Notícias', icon: '📰', accent: '#0066CC', spark: [1, 3, 2, 5, 4, 7, 6] },
  { key: 'diarios', label: 'Diários', icon: '📜', accent: '#00A335', spark: [0, 1, 1, 2, 2, 3, 3] },
  { key: 'votes', label: 'Votos', icon: '🗳️', accent: '#3b82f6', spark: [10, 25, 18, 40, 35, 55, 48] },
  { key: 'ratings', label: 'Avaliações', icon: '⭐', accent: '#E6A817', spark: [5, 8, 12, 10, 15, 20, 18] },
] as const;

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    refetchInterval: 30000,
  });
  const { data: news } = useNews();
  const { data: politicians } = usePoliticians();
  const { data: promises } = usePromises();

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const promisesDone = promises?.filter(p => p.status === 'done').length || 0;
  const promisesTotal = promises?.length || 0;
  const promiseRate = promisesTotal > 0 ? Math.round((promisesDone / promisesTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-xl font-bold text-white">{greeting}, Admin 👋</h1>
        <p className="text-sm text-white/35 mt-0.5">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map(card => (
          <motion.div
            key={card.key}
            variants={fadeUp}
            className="bg-[#1a1d2e] border border-white/5 rounded-xl p-3.5 hover:border-white/10 transition-colors group relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkline data={card.spark} color={card.accent} />
            </div>
            <span className="text-base">{card.icon}</span>
            <div className="text-xl font-bold text-white tabular-nums mt-2 leading-none">
              {isLoading ? <span className="text-white/20">—</span> : <Counter value={stats?.[card.key] ?? 0} />}
            </div>
            <div className="text-[10px] text-white/35 font-medium mt-1">{card.label}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${card.accent}40, transparent)` }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Promessas overview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1d2e] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white/80">Promessas</h2>
            <Link to="/admin/promises" className="text-[10px] text-green hover:text-green-light transition-colors">Gerenciar →</Link>
          </div>
          {/* Donut visual */}
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#00A335" strokeWidth="3" strokeDasharray={`${promiseRate} ${100 - promiseRate}`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white tabular-nums">{promiseRate}%</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: 'Cumpridas', value: promisesDone, color: 'bg-green' },
                { label: 'Andamento', value: promises?.filter(p => p.status === 'progress').length || 0, color: 'bg-blue' },
                { label: 'Pendentes', value: promises?.filter(p => p.status === 'pending').length || 0, color: 'bg-white/20' },
                { label: 'Descumpridas', value: promises?.filter(p => p.status === 'failed').length || 0, color: 'bg-red' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
                  <span className="text-[11px] text-white/40 flex-1">{s.label}</span>
                  <span className="text-[11px] text-white/70 font-bold tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top políticos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1a1d2e] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white/80">Top Políticos</h2>
            <Link to="/admin/politicians" className="text-[10px] text-green hover:text-green-light transition-colors">Ver todos →</Link>
          </div>
          <div className="space-y-2.5">
            {politicians?.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  i === 1 ? 'bg-white/10 text-white/50' :
                  i === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-white/5 text-white/30'
                }`}>{i + 1}</span>
                {p.photo_url ? (
                  <img src={p.photo_url} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/40 font-bold">
                    {p.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 truncate">{p.name}</p>
                  <p className="text-[10px] text-white/30">{p.party}</p>
                </div>
                <span className={`text-xs font-bold tabular-nums ${
                  Number(p.score) >= 70 ? 'text-green' : Number(p.score) >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{Number(p.score).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Últimas notícias */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1a1d2e] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white/80">Últimas Notícias</h2>
            <span className="text-[10px] text-white/30">{news?.length || 0} total</span>
          </div>
          <div className="space-y-3">
            {news?.slice(0, 4).map(n => (
              <div key={n.id} className="flex gap-3 group">
                {n.cover_url ? (
                  <div className="w-12 h-9 rounded overflow-hidden shrink-0 border border-white/5">
                    <img src={n.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-9 rounded bg-white/5 flex items-center justify-center shrink-0 text-xs opacity-40">📰</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{n.category}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Ações rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#1a1d2e] border border-white/5 rounded-xl p-5"
      >
        <h2 className="text-sm font-bold text-white/80 mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { to: '/admin/diario', icon: '📜', label: 'Gerenciar Diários', desc: 'Baixar e analisar edições' },
            { to: '/admin/politicians', icon: '🏛️', label: 'Sincronizar Políticos', desc: 'Atualizar dados do TSE' },
            { to: '/admin/promises', icon: '📋', label: 'Pesquisar Promessas', desc: 'IA busca promessas' },
            { to: '/admin/nepotism', icon: '🔍', label: 'Análise Nepotismo', desc: 'Verificar parentescos' },
          ].map(a => (
            <Link
              key={a.to}
              to={a.to}
              className="bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
            >
              <span className="text-lg">{a.icon}</span>
              <p className="text-xs text-white/60 font-medium mt-1.5 group-hover:text-white/80 transition-colors">{a.label}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{a.desc}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Status do sistema */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-4 text-[10px] text-white/20 px-1"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          Sistema operacional
        </span>
        <span>Última atualização: {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span>Auto-refresh: 30s</span>
      </motion.div>
    </div>
  );
}
