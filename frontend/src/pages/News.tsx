import { Link } from 'react-router-dom';
import { useNews } from '../hooks/useNews';
import PageTitle from '../components/shared/PageTitle';
import { formatDate, truncate } from '../utils/formatters';

export default function News() {
  const { data: news, isLoading } = useNews();

  const featured = news?.[0];
  const rest = news?.slice(1) || [];

  return (
    <div>
      <PageTitle title="Notícias" subtitle="Jornalismo de dados sobre a política tocantinense" />

      {isLoading ? (
        <div className="text-center py-16 text-muted text-sm">Carregando...</div>
      ) : news && news.length > 0 ? (
        <div className="space-y-6">
          {/* Hero */}
          {featured && (
            <Link
              to={`/news/${featured.id}`}
              className="block bg-white rounded-lg border border-border overflow-hidden hover:shadow-hover transition-shadow group"
            >
              {featured.cover_url ? (
                <div className="h-[280px] md:h-[360px] overflow-hidden">
                  <img src={featured.cover_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center" style={{ backgroundColor: featured.cover_color || '#E8F5E9' }}>
                  <span className="text-7xl opacity-40">{featured.cover_emoji || '📰'}</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Destaque</span>
                  {featured.category && <span className="text-[11px] text-green font-medium">{featured.category}</span>}
                  <span className="text-[11px] text-muted">{formatDate(featured.published_at)}</span>
                </div>
                <h2 className="text-2xl font-bold text-ink leading-tight group-hover:text-green transition-colors">{featured.title}</h2>
                {featured.summary && <p className="text-sm text-muted mt-2">{featured.summary}</p>}
              </div>
            </Link>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map(article => (
              <Link
                key={article.id}
                to={`/news/${article.id}`}
                className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-hover transition-shadow group"
              >
                {article.cover_url ? (
                  <div className="h-40 overflow-hidden">
                    <img src={article.cover_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center" style={{ backgroundColor: article.cover_color || '#F0F0F0' }}>
                    <span className="text-4xl opacity-40">{article.cover_emoji || '📰'}</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {article.category && <span className="text-[10px] font-bold text-green uppercase">{article.category}</span>}
                    <span className="text-[10px] text-muted">{formatDate(article.published_at)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-green transition-colors line-clamp-2">{article.title}</h3>
                  {article.summary && <p className="text-xs text-muted mt-1 line-clamp-2">{truncate(article.summary, 100)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted text-sm text-center py-16">Nenhuma notícia publicada.</p>
      )}
    </div>
  );
}
