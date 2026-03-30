import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PoliticianAttributes {
  id: number;
  name: string;
  role: 'governador' | 'senador' | 'dep_federal' | 'dep_estadual' | 'prefeito' | 'vereador';
  party: string | null;
  city: string | null;
  state: string;
  bio: string | null;
  photo_url: string | null;
  tse_id: string | null;
  score: number;
  total_votes: number;
  active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type PoliticianCreation = Optional<PoliticianAttributes, 'id' | 'party' | 'city' | 'state' | 'bio' | 'photo_url' | 'tse_id' | 'score' | 'total_votes' | 'active'>;

class Politician extends Model<PoliticianAttributes, PoliticianCreation> implements PoliticianAttributes {
  declare id: number;
  declare name: string;
  declare role: 'governador' | 'senador' | 'dep_federal' | 'dep_estadual' | 'prefeito' | 'vereador';
  declare party: string | null;
  declare city: string | null;
  declare state: string;
  declare bio: string | null;
  declare photo_url: string | null;
  declare tse_id: string | null;
  declare score: number;
  declare total_votes: number;
  declare active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

Politician.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    role: { type: DataTypes.ENUM('governador', 'senador', 'dep_federal', 'dep_estadual', 'prefeito', 'vereador') },
    party: { type: DataTypes.STRING(50) },
    city: { type: DataTypes.STRING(100) },
    state: { type: DataTypes.STRING(2), defaultValue: 'TO' },
    bio: { type: DataTypes.TEXT },
    photo_url: { type: DataTypes.STRING(500) },
    tse_id: { type: DataTypes.STRING(50) },
    score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    total_votes: { type: DataTypes.INTEGER, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'politicians', underscored: true }
);

export default Politician;
