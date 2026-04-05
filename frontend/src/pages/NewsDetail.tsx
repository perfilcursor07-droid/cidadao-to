import { useParams, Link } from 'react-router-dom';
import { useArticle, useNews } from '../hooks/useNews';
import { formatDate } from '../utils/formatters';

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useArticle(Number(id));
  const { data: allNews } = useNews();

  const otherNews = allNews?.filter(n => n.id !== Number(id)).slice(0, 4) || [];

  if (isLoading) return <div className="text-center py-20 text-muted text-sm">Carregando...</div>;
  if (!article) return (
    <div className="text-center py-20">
      <p className="text-red text-sm">Notícia não encontrada.</p>
      <Link to="/news" className="text-green text-sm mt-2 inline-block hover:underline">← Voltar para notícias</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-[11px] text-muted mb-4">
        <Link to="/" className="hover:text-green transition-colors">Início</Link>
        <span className="mx-1.5">/</span>
        <Link to="/news" className="hover:text-green transition-colors">Notícias</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{article.category || 'Notícia'}</span>
      </div>

      {/* Article */}
      <article className="bg-white rounded-lg border border-border overflow-hidden">
        {/* Cover image */}
        {article.cover_url ? (
          <div className="w-full h-[300px] md:h-[400px] overflow-hidden">
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[200px] flex items-center justify-center" style={{ backgroundColor: article.cover_color || '#E8F5E9' }}>
            <span className="text-7xl opacity-40">{article.cover_emoji || '📰'}</span>
          </div>
        )}

        <div className="p-6 md:p-10">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            {article.category && (
              <span className="bg-green text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                {article.category}
              </span>
            )}
            <span className="text-[12px] text-muted">{formatDate(article.published_at)}</span>
            {article.author && <span className="text-[12px] text-muted">por {article.author.name}</span>}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight">
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p className="text-lg text-ink2/80 mt-4 leading-relaxed italic border-l-4 border-green pl-4">
              {article.summary}
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-border my-6" />

          {/* Content */}
          {article.content && (
            <div
              className="prose prose-sm max-w-none text-ink2 leading-[1.8] text-[15px]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}

          {/* Share / back */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <Link to="/news" className="text-sm text-green font-medium hover:underline">
              ← Voltar para notícias
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>Compartilhar:</span>
              <button className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">𝕏</button>
              <button className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">📋</button>
            </div>
          </div>
        </div>
      </article>

      {/* Other news */}
      {otherNews.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink mb-4">Outras Notícias</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherNews.map(n => (
              <Link
                key={n.id}
                to={`/news/${n.id}`}
                className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-hover transition-shadow group"
              >
                {n.cover_url ? (
                  <div className="h-36 overflow-hidden">
                    <img src={n.cover_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-36 flex items-center justify-center" style={{ backgroundColor: n.cover_color || '#F0F0F0' }}>
                    <span className="text-4xl opacity-40">{n.cover_emoji || '📰'}</span>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {n.category && <span className="text-[10px] font-bold text-green uppercase">{n.category}</span>}
                    <span className="text-[10px] text-muted">{formatDate(n.published_at)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-green transition-colors line-clamp-2">
                    {n.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
