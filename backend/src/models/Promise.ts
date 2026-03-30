import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PromiseAttributes {
  id: number;
  politician_id: number;
  title: string;
  description: string | null;
  area: string | null;
  status: 'pending' | 'progress' | 'done' | 'failed';
  progress_pct: number;
  source_url: string | null;
  deadline: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type PromiseCreation = Optional<PromiseAttributes, 'id' | 'description' | 'area' | 'status' | 'progress_pct' | 'source_url' | 'deadline'>;

class PromiseModel extends Model<PromiseAttributes, PromiseCreation> implements PromiseAttributes {
  declare id: number;
  declare politician_id: number;
  declare title: string;
  declare description: string | null;
  declare area: string | null;
  declare status: 'pending' | 'progress' | 'done' | 'failed';
  declare progress_pct: number;
  declare source_url: string | null;
  declare deadline: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

PromiseModel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    politician_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    area: { type: DataTypes.STRING(100) },
    status: { type: DataTypes.ENUM('pending', 'progress', 'done', 'failed'), defaultValue: 'pending' },
    progress_pct: { type: DataTypes.INTEGER, defaultValue: 0 },
    source_url: { type: DataTypes.STRING(500) },
    deadline: { type: DataTypes.DATEONLY },
  },
  { sequelize, tableName: 'promises', underscored: true }
);

export default PromiseModel;
