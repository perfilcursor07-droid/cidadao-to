import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface RatingAttributes {
  id: number;
  user_id: number;
  politician_id: number;
  attendance: number;
  project_quality: number;
  transparency: number;
  communication: number;
  average: number | null;
  created_at?: Date;
  updated_at?: Date;
}

type RatingCreation = Optional<RatingAttributes, 'id' | 'average'>;

class Rating extends Model<RatingAttributes, RatingCreation> implements RatingAttributes {
  declare id: number;
  declare user_id: number;
  declare politician_id: number;
  declare attendance: number;
  declare project_quality: number;
  declare transparency: number;
  declare communication: number;
  declare average: number | null;
  declare created_at: Date;
  declare updated_at: Date;
}

Rating.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    politician_id: { type: DataTypes.INTEGER, allowNull: false },
    attendance: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 1, max: 5 } },
    project_quality: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 1, max: 5 } },
    transparency: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 1, max: 5 } },
    communication: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 1, max: 5 } },
    average: { type: DataTypes.DECIMAL(3, 2) },
  },
  {
    sequelize,
    tableName: 'ratings',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id', 'politician_id'] }],
  }
);

export default Rating;
