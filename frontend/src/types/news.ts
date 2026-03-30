export interface NewsArticle {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  author_id: number | null;
  featured: boolean;
  published: boolean;
  cover_emoji: string | null;
  cover_color: string | null;
  cover_url: string | null;
  published_at: string | null;
  author?: { id: number; name: string };
}
