import { NewsArticle } from '../../types/news';
import { formatDate, truncate } from '../../utils/formatters';

interface Props {
  article: NewsArticle;
  onClick: () => void;
}

export default function NewsCard({ article, onClick }: Props) {
  return (
    <button onClick={onClick} className="bg-white border border-border rounded-lg p-4 text-left hover:shadow-hover transition-all w-full group">
      <div className="flex items-center gap-2 mb-2">
        {article.cover_emoji && <span className="text-xl">{article.cover_emoji}</span>}
        {article.category && <span className="text-[10px] font-bold uppercase tracking-wider text-green">{article.category}</span>}
      </div>
      <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-green transition-colors">{article.title}</h3>
      {article.summary && <p className="text-xs text-muted mt-1 line-clamp-2">{truncate(article.summary, 120)}</p>}
      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted">
        {article.author && <span>{article.author.name}</span>}
        <span>{formatDate(article.published_at)}</span>
      </div>
    </button>
  );
}
