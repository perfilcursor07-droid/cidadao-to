import { Link } from 'react-router-dom';
import { usePoliticians } from '../hooks/usePoliticians';
import { useNews } from '../hooks/useNews';
import { usePromises } from '../hooks/usePromises';
import Sidebar from '../components/layout/Sidebar';
import { formatScore, formatDate, truncate } from '../utils/formatters';
import { getScoreColor, getScoreLabel } from '../utils/scoreHelpers';
import ScoreRing from '../components/politicians/ScoreRing';

export default function Home() {
  const { data: politicians } = usePoliticians();
  const { data: news } = useNews();
  const { data: promises } = usePromises();

  const totalPoliticians = politicians?.length || 0;
  const totalPromises = promises?.length || 0;
  const donePromises = promises?.filter(p => p.status === 'done').length || 0;

  const heroNews = news?.[0];
  const latestNews = news?.slice(1, 5) || [];
  const moreNews = news?.slice(5) || [];

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Políticos', value: totalPoliticians, color: 'text-green', bg: 'bg-green/5 border-green/10' },
          { label: 'Promessas', value: totalPromises, color: 'text-blue', bg: 'bg-blue/5 border-blue/10' },
          { label: 'Cumpridas', value: donePromises, color: 'text-green', bg: 'bg-green/5 border-green/10' },
          { label: 'Taxa', value: totalPromises > 0 ? `${((donePromises / totalPromises) * 100).toFixed(0)}%` : '0%', color: 'text-gold', bg: 'bg-gold/5 border-gold/10' },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-lg p-3 ${s.bg}`}>
            <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-muted font-medium uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* POLÍTICOS EM DESTAQUE — no topo */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-ink">🏛️ Políticos em Destaque</h2>
          <Link to="/politicians" className="text-xs text-green font-medium hover:underline">Ver todos →</Link>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {politicians?.slice(0, 6).map((p, i) => (
              <Link
                key={p.id}
                to={`/politicians/${p.id}`}
                className={`flex flex-col items-center gap-2 p-4 min-w-[140px] hover:bg-gray-50 transition-colors group ${
                  i > 0 ? 'border-l border-border' : ''
                }`}
              >
                <ScoreRing score={p.score} size={52} />
                <div className="text-center">
                  <p className="text-xs font-bold text-ink group-hover:text-green transition-colors truncate max-w-[120px]">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-muted">{p.party}</p>
                  <p className="text-[10px] text-muted">{p.total_votes} votos</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Hero news com imagem */}
          {heroNews && (
            <Link
              to={`/news/${heroNews.id}`}
              className="block bg-white rounded-lg border border-border overflow-hidden hover:shadow-hover transition-shadow group"
            >
              {heroNews.cover_url ? (
                <div className="h-[240px] md:h-[300px] overflow-hidden">
                  <img
                    src={heroNews.cover_url}
                    alt={heroNews.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center" style={{ backgroundColor: heroNews.cover_color || '#E8F5E9' }}>
                  <span className="text-6xl opacity-40">{heroNews.cover_emoji || '📰'}</span>
                </div>
              )}
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
            </Link>
          )}

          {/* 4 últimas notícias — grid com imagem */}
          {latestNews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-ink">📰 Últimas Notícias</h2>
                <Link to="/news" className="text-xs text-green font-medium hover:underline">Ver todas →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestNews.map(article => (
                  <Link
                    key={article.id}
                    to={`/news/${article.id}`}
                    className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-hover transition-shadow group"
                  >
                    {article.cover_url ? (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={article.cover_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                ))}
              </div>
            </div>
          )}

          {/* More news — lista */}
          {moreNews.length > 0 && (
            <div className="bg-white rounded-lg border border-border overflow-hidden">
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
            </div>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
