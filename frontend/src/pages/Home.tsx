import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePoliticians } from '../hooks/usePoliticians';
import { useNews } from '../hooks/useNews';
import Sidebar from '../components/layout/Sidebar';
import { formatDate, truncate } from '../utils/formatters';
import api from '../services/api';

function AnimatedCurrency({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2000, 1);
      setDisplay((1 - Math.pow(1 - p, 3)) * value);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);
  return <span ref={ref}>{display.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>;
}

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [.22, 1, .36, 1] } } };

export default function Home() {
  const { data: politicians } = usePoliticians();
  const { data: news } = useNews();
  const now = new Date();
  const mesRef = now.getMonth() === 0 ? 12 : now.getMonth();
  const anoRef = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const meses = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const { data: salaryData } = useQuery<{ ano: number; mes: number; resultados: any[] }>({
    queryKey: ['home-salaries', anoRef, mesRef],
    queryFn: () => api.get(`/salaries/vereadores?ano=${anoRef}&mes=${mesRef}`).then(r => r.data),
    staleTime: 1000 * 60 * 30,
  });

  const ranking = (salaryData?.resultados || [])
    .map(r => {
      const total = r.servidores.reduce((s: number, sv: any) => s + (sv.liquido || 0), 0);
      const ver = r.servidores.find((s: any) => s.cargo?.toLowerCase().includes('vereador'));
      return { id: r.politician_id, name: r.politician_name, salario: ver?.liquido || 0,
        func: r.servidores.filter((s: any) => !s.cargo?.toLowerCase().includes('vereador')).length, total };
    }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);

  const custoTotal = ranking.reduce((s, r) => s + r.total, 0);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const top3 = ranking.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  const heroNews = news?.[0];
  const latestNews = news?.slice(1, 5) || [];
  const moreNews = news?.slice(5) || [];

  return (
    <div className="space-y-6">

      {/* Custômetro compacto */}
      {top3.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden border border-white/5 shadow-xl">
          <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red/20 flex items-center justify-center">
                <span className="text-xl animate-pulse">🔥</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Custômetro da Câmara</h2>
                <p className="text-[10px] text-white/40">{meses[mesRef]}/{anoRef} · Gabinetes mais caros</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase tracking-wider">Custo total/mês</p>
              <p className="text-lg font-black text-red tabular-nums leading-tight">
                <AnimatedCurrency value={custoTotal} />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
            {top3.map((r, i) => (
              <Link key={r.id} to={`/politicians/${r.id}`}
                className="relative bg-gray-900 px-4 py-4 hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{medals[i]}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    i === 0 ? 'bg-red/20 text-red' : i === 1 ? 'bg-orange-400/20 text-orange-400' : 'bg-yellow-400/20 text-yellow-400'
                  }`}>#{i + 1}</span>
                </div>
                <p className="text-sm font-bold text-white truncate group-hover:text-red transition-colors">{r.name}</p>
                <p className="text-lg font-black text-white tabular-nums mt-1">{fmt(r.total)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-white/30">{r.func} func.</span>
                  <span className="text-[10px] text-green/70">Salário: {fmt(r.salario)}</span>
                </div>
                <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.total / (ranking[0]?.total || 1)) * 100}%` }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.15 }}
                    className={`h-full rounded-full ${i === 0 ? 'bg-red' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                </div>
              </Link>
            ))}
          </div>

          <Link to="/salaries"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-red/10 hover:bg-red/20 transition-colors border-t border-white/[0.04]">
            <span className="text-xs font-bold text-red">Ver ranking completo de todos os vereadores</span>
            <span className="text-red">→</span>
          </Link>
        </motion.div>
      )}

      {/* Políticos em destaque */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-ink">🏛️ Políticos em Destaque</h2>
          <Link to="/politicians" className="text-xs text-green font-medium hover:underline">Ver todos →</Link>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {politicians?.slice(0, 15).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.4 }}>
                <Link to={`/politicians/${p.id}`}
                  className={`flex flex-col items-center gap-2 p-4 min-w-[130px] hover:bg-green/5 transition-all group ${i > 0 ? 'border-l border-border' : ''}`}>
                  <div className="relative">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-sm font-bold text-muted">{p.name.split(' ').slice(0, 2).map(w => w[0]).join('')}</span>
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${
                      Number(p.score) >= 70 ? 'bg-green' : Number(p.score) >= 40 ? 'bg-gold' : Number(p.score) > 0 ? 'bg-red' : 'bg-gray-400'
                    }`}>{Number(p.score).toFixed(0)}</div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-ink group-hover:text-green transition-colors truncate max-w-[110px]">{p.name}</p>
                    <p className="text-[10px] text-muted">{p.party}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Notícias + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {heroNews && (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Link to={`/news/${heroNews.id}`} className="block bg-white rounded-lg border border-border overflow-hidden hover:shadow-hover transition-shadow group">
                {heroNews.cover_url ? (
                  <div className="h-[240px] md:h-[300px] overflow-hidden relative">
                    <img src={heroNews.cover_url} alt={heroNews.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded animate-pulse">Destaque</span>
                        {heroNews.category && <span className="text-[11px] text-white/80">{heroNews.category}</span>}
                        <span className="text-[11px] text-white/60">{formatDate(heroNews.published_at)}</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold leading-tight">{heroNews.title}</h2>
                      {heroNews.summary && <p className="text-sm text-white/75 mt-2 line-clamp-2">{heroNews.summary}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <span className="bg-red text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">Destaque</span>
                    <h2 className="text-xl font-bold text-ink mt-2 group-hover:text-green transition-colors">{heroNews.title}</h2>
                  </div>
                )}
              </Link>
            </motion.div>
          )}

          {latestNews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-ink">📰 Últimas Notícias</h2>
                <Link to="/news" className="text-xs text-green font-medium hover:underline">Ver todas →</Link>
              </div>
              <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestNews.map(article => (
                  <motion.div key={article.id} variants={fadeUp}>
                    <Link to={`/news/${article.id}`} className="block bg-white border border-border rounded-lg overflow-hidden hover:shadow-hover transition-all group hover:-translate-y-1">
                      {article.cover_url ? (
                        <div className="h-36 overflow-hidden"><img src={article.cover_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                      ) : (
                        <div className="h-36 flex items-center justify-center bg-gray-50"><span className="text-4xl opacity-30">{article.cover_emoji || '📰'}</span></div>
                      )}
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {article.category && <span className="text-[10px] font-bold text-green uppercase">{article.category}</span>}
                          <span className="text-[10px] text-muted">{formatDate(article.published_at)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-green transition-colors line-clamp-2">{article.title}</h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {moreNews.length > 0 && (
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-bold text-ink">Mais Notícias</h2></div>
              <div className="divide-y divide-border">
                {moreNews.map(article => (
                  <Link key={article.id} to={`/news/${article.id}`} className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group">
                    {article.cover_url ? (
                      <div className="w-20 h-14 rounded overflow-hidden shrink-0"><img src={article.cover_url} alt="" className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="w-20 h-14 rounded shrink-0 flex items-center justify-center bg-gray-50"><span className="text-xl opacity-30">📰</span></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-ink group-hover:text-green transition-colors line-clamp-2">{article.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                        {article.category && <span className="text-green font-medium">{article.category}</span>}
                        <span>{formatDate(article.published_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
