import { NewsArticle } from '../../types/news';
import { formatDate } from '../../utils/formatters';
import { motion } from 'framer-motion';

interface Props {
  article: NewsArticle;
  onClose: () => void;
}

export default function NewsModal({ article, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6" style={{ backgroundColor: article.cover_color || '#E8F5E9' }}>
          <div className="flex items-start justify-between">
            <div className="text-4xl">{article.cover_emoji || '📰'}</div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-ink/50 hover:bg-black/20 text-sm" aria-label="Fechar">✕</button>
          </div>
          <div className="mt-3">
            {article.category && (
              <span className="inline-block bg-green text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2">
                {article.category}
              </span>
            )}
            <h2 className="text-xl font-bold text-ink leading-tight">{article.title}</h2>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-muted">
              {article.author && <span>{article.author.name}</span>}
              <span>{formatDate(article.published_at)}</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          {article.summary && <p className="text-ink2 italic mb-4 pb-4 border-b border-border text-sm leading-relaxed">{article.summary}</p>}
          {article.content && <div className="prose prose-sm max-w-none text-ink2 leading-relaxed" dangerouslySetInnerHTML={{ __html: article.content }} />}
        </div>
      </motion.div>
    </div>
  );
}
