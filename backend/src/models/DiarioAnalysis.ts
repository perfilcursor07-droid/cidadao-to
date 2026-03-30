import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DiarioAnalysisAttributes {
  id: number;
  edition: string | null;
  edition_date: Date | null;
  raw_text: string | null;
  summary: string | null;
  items: object | null;
  alerts: object | null;
  keywords: object | null;
  ai_model: string | null;
  created_at?: Date;
}

type DiarioCreation = Optional<DiarioAnalysisAttributes, 'id' | 'edition' | 'edition_date' | 'raw_text' | 'summary' | 'items' | 'alerts' | 'keywords' | 'ai_model'>;

class DiarioAnalysis extends Model<DiarioAnalysisAttributes, DiarioCreation> implements DiarioAnalysisAttributes {
  declare id: number;
  declare edition: string | null;
  declare edition_date: Date | null;
  declare raw_text: string | null;
  declare summary: string | null;
  declare items: object | null;
  declare alerts: object | null;
  declare keywords: object | null;
  declare ai_model: string | null;
  declare created_at: Date;
}

DiarioAnalysis.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    edition: { type: DataTypes.STRING(50) },
    edition_date: { type: DataTypes.DATEONLY },
    raw_text: { type: DataTypes.TEXT('long') },
    summary: { type: DataTypes.TEXT },
    items: { type: DataTypes.JSON },
    alerts: { type: DataTypes.JSON },
    keywords: { type: DataTypes.JSON },
    ai_model: { type: DataTypes.STRING(80) },
  },
  { sequelize, tableName: 'diario_analyses', underscored: true, updatedAt: false }
);

export default DiarioAnalysis;
