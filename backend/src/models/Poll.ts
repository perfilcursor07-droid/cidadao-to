import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PollAttributes {
  id: number;
  title: string;
  description: string | null;
  options: string[];
  active: boolean;
  ends_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type PollCreation = Optional<PollAttributes, 'id' | 'description' | 'active' | 'ends_at'>;

class Poll extends Model<PollAttributes, PollCreation> implements PollAttributes {
  declare id: number;
  declare title: string;
  declare description: string | null;
  declare options: string[];
  declare active: boolean;
  declare ends_at: Date | null;
}

Poll.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    options: { type: DataTypes.JSON, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    ends_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'polls', underscored: true }
);

export default Poll;
