import { NewsArticle } from '../../types/news';
import NewsCard from './NewsCard';

interface Props {
  articles: NewsArticle[];
  onSelect: (article: NewsArticle) => void;
}

export default function NewsGrid({ articles, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map(article => (
        <NewsCard key={article.id} article={article} onClick={() => onSelect(article)} />
      ))}
    </div>
  );
}
