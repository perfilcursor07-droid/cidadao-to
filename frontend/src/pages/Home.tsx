import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { usePoliticians } from '../hooks/usePoliticians';
import { useNews } from '../hooks/useNews';
import { usePromises } from '../hooks/usePromises';
import Sidebar from '../components/layout/Sidebar';
import { formatScore, formatDate, truncate } from '../utils/formatters';
import { getScoreColor, getScoreLabel } from '../utils/scoreHelpers';

/* ── animated counter ── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ── stagger helpers ── */
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [.22,1,.36,1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export default function Home() {
  const { data: politicians } = usePoliticians();
  const { data: news } = useNews();
  const { data: promises } = usePromises();

  const totalPoliticians = politicians?.length || 0;
  const totalPromises = promises?.length || 0;
  const donePromises = promises?.filter(p => p.status === 'done').length || 0;
  const rate = totalPromises > 0 ? Math.round((donePromises / totalPromises) * 100) : 0;

  const heroNews = news?.[0];
  const latestNews = news?.slice(1, 5) || [];
  const moreNews = news?.slice(5) || [];

  return (
    <div className="space-y-6">
      {/* ── Hero banner compacto ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [.22,1,.36,1] }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-dark via-green to-green-light px-5 py-3.5 text-white"
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E")',
        }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-base md:text-lg font-bold">Fiscalize. Avalie. Cobre.</h1>
            <span className="hidden sm:inline text-xs text-white/70">Transparência política do Tocantins em tempo real</span>
          </div>
          <div className="flex gap-2">
            <Link to="/politicians" className="inline-flex items-center gap-1.5 bg-white text-green font-semibold text-xs px-3.5 py-1.5 rounded-md hover:bg-white/90 transition-colors shadow-sm">
              🏛️ Políticos
            </Link>
            <Link to="/promises" className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white font-semibold text-xs px-3.5 py-1.5 rounded-md hover:bg-white/25 transition-colors border border-white/20">
              📋 Promessas
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stats animados ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Políticos', value: totalPoliticians, icon: '🏛️', color: 'text-green', bg: 'bg-green/5 border-green/10' },
          { label: 'Promessas', value: totalPromises, icon: '📋', color: 'text-blue', bg: 'bg-blue/5 border-blue/10' },
          { label: 'Cumpridas', value: donePromises, icon: '✅', color: 'text-green', bg: 'bg-green/5 border-green/10' },
          { label: 'Taxa', value: rate, icon: '📊', color: 'text-gold', bg: 'bg-gold/5 border-gold/10', suffix: '%' },
        ].map(s => (
          <motion.div key={s.label} variants={fadeUp} className={`bg-white border rounded-lg p-4 ${s.bg} hover:shadow-card transition-shadow`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold tabular-nums ${s.color}`}>
              <AnimatedNumber value={typeof s.value === 'number' ? s.value : 0} suffix={s.suffix} />
            </div>
            <div className="text-[11px] text-muted font-medium uppercase tracking-wide">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Políticos em destaque ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white rounded-lg border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-ink">🏛️ Políticos em Destaque</h2>
          <Link to="/politicians" className="text-xs text-green font-medium hover:underline">Ver todos →</Link>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {politicians?.slice(0, 15).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4, ease: [.22,1,.36,1] }}
              >
                <Link
                  to={`/politicians/${p.id}`}
                  className={`flex flex-col items-center gap-2 p-4 min-w-[140px] hover:bg-green/5 transition-all duration-200 group ${
                    i > 0 ? 'border-l border-border' : ''
                  }`}
                >
                  <div className="relative">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="w-[56px] h-[56px] rounded-full object-cover border-2 border-white shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <span className="text-sm font-bold text-muted">
                          {p.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${
                      Number(p.score) >= 70 ? 'bg-green' : Number(p.score) >= 40 ? 'bg-gold' : Number(p.score) > 0 ? 'bg-red' : 'bg-gray-400'
                    }`}>
                      {Number(p.score).toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-ink group-hover:text-green transition-colors truncate max-w-[120px]">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-muted">{p.party}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Hero news */}
          {heroNews && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link
                to={`/news/${heroNews.id}`}
                className="block bg-white rounded-lg border border-border overflow-hidden hover:shadow-hover transition-shadow group relative"
              >
                {heroNews.cover_url ? (
                  <div className="h-[240px] md:h-[320px] overflow-hidden relative">
                    <img
                      src={heroNews.cover_url}
                      alt={heroNews.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded animate-pulse">
                          Destaque
                        </span>
                        {heroNews.category && <span className="text-[11px] text-white/80 font-medium">{heroNews.category}</span>}
                        <span className="text-[11px] text-white/60">{formatDate(heroNews.published_at)}</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold leading-tight drop-shadow-sm">
                        {heroNews.title}
                      </h2>
                      {heroNews.summary && (
                        <p className="text-sm text-white/75 mt-2 line-clamp-2">{heroNews.summary}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-[200px] flex items-center justify-center" style={{ backgroundColor: heroNews.cover_color || '#E8F5E9' }}>
                      <span className="text-6xl opacity-40">{heroNews.cover_emoji || '📰'}</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          Destaque
                        </span>
                        {heroNews.category && <span className="text-[11px] text-green font-medium">{heroNews.category}</span>}
                        <span className="text-[11px] text-muted">{formatDate(heroNews.published_at)}</span>
                      </div>
                      <h2 className="text-xl font-bold text-ink leading-tight group-hover:text-green transition-colors">
                        {heroNews.title}
                      </h2>
                      {heroNews.summary && (
                        <p className="text-sm text-muted mt-2 line-clamp-2">{heroNews.summary}</p>
                      )}
                    </div>
                  </>
                )}
              </Link>
            </motion.div>
          )}

          {/* 4 últimas notícias */}
          {latestNews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-ink">📰 Últimas Notícias</h2>
                <Link to="/news" className="text-xs text-green font-medium hover:underline">Ver todas →</Link>
              </div>
              <motion.div
                variants={container}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {latestNews.map(article => (
                  <motion.div key={article.id} variants={fadeUp}>
                    <Link
                      to={`/news/${article.id}`}
                      className="block bg-white border border-border rounded-lg overflow-hidden hover:shadow-hover transition-all duration-300 group hover:-translate-y-1"
                    >
                      {article.cover_url ? (
                        <div className="h-40 overflow-hidden">
                          <img
                            src={article.cover_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center" style={{ backgroundColor: article.cover_color || '#F0F0F0' }}>
                          <span className="text-4xl opacity-40">{article.cover_emoji || '📰'}</span>
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {article.category && <span className="text-[10px] font-bold text-green uppercase">{article.category}</span>}
                          <span className="text-[10px] text-muted">{formatDate(article.published_at)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-green transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-xs text-muted mt-1 line-clamp-2">{truncate(article.summary, 90)}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Mais notícias — lista */}
          {moreNews.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg border border-border overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-bold text-ink">Mais Notícias</h2>
              </div>
              <div className="divide-y divide-border">
                {moreNews.map(article => (
                  <Link
                    key={article.id}
                    to={`/news/${article.id}`}
                    className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group"
                  >
                    {article.cover_url ? (
                      <div className="w-20 h-14 rounded overflow-hidden shrink-0">
                        <img src={article.cover_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-14 rounded shrink-0 flex items-center justify-center" style={{ backgroundColor: article.cover_color || '#F0F0F0' }}>
                        <span className="text-xl opacity-40">{article.cover_emoji || '📰'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-ink group-hover:text-green transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                        {article.category && <span className="text-green font-medium">{article.category}</span>}
                        <span>{formatDate(article.published_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
