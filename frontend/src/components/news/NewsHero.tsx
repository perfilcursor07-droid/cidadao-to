import { NewsArticle } from '../../types/news';
import { formatDate } from '../../utils/formatters';

interface Props {
  article: NewsArticle;
  onClick: () => void;
}

export default function NewsHero({ article, onClick }: Props) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-lg overflow-hidden border border-border hover:shadow-hover transition-all group">
      <div className="p-8" style={{ backgroundColor: article.cover_color || '#E8F5E9' }}>
        <div className="text-5xl mb-3 opacity-60">{article.cover_emoji || '📰'}</div>
        <span className="inline-block bg-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2">Destaque</span>
        <h2 className="text-xl md:text-2xl font-bold text-ink leading-tight group-hover:text-green transition-colors">{article.title}</h2>
        {article.summary && <p className="text-sm text-ink2/80 mt-2 line-clamp-3">{article.summary}</p>}
        <p className="text-[11px] text-muted mt-3">{formatDate(article.published_at)}</p>
      </div>
    </button>
  );
}
