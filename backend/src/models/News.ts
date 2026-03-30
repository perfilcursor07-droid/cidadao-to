import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NewsAttributes {
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
  published_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type NewsCreation = Optional<NewsAttributes, 'id' | 'summary' | 'content' | 'category' | 'author_id' | 'featured' | 'published' | 'cover_emoji' | 'cover_color' | 'cover_url' | 'published_at'>;

class News extends Model<NewsAttributes, NewsCreation> implements NewsAttributes {
  declare id: number;
  declare title: string;
  declare summary: string | null;
  declare content: string | null;
  declare category: string | null;
  declare author_id: number | null;
  declare featured: boolean;
  declare published: boolean;
  declare cover_emoji: string | null;
  declare cover_color: string | null;
  declare cover_url: string | null;
  declare published_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

News.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT('long') },
    category: { type: DataTypes.STRING(80) },
    author_id: { type: DataTypes.INTEGER },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    published: { type: DataTypes.BOOLEAN, defaultValue: false },
    cover_emoji: { type: DataTypes.STRING(10) },
    cover_color: { type: DataTypes.STRING(20) },
    cover_url: { type: DataTypes.STRING(500) },
    published_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'news', underscored: true }
);

export default News;
