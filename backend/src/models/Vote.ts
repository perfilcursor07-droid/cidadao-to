import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface VoteAttributes {
  id: number;
  user_id: number;
  politician_id: number;
  type: 'approve' | 'disapprove';
  created_at?: Date;
  updated_at?: Date;
}

type VoteCreation = Optional<VoteAttributes, 'id'>;

class Vote extends Model<VoteAttributes, VoteCreation> implements VoteAttributes {
  declare id: number;
  declare user_id: number;
  declare politician_id: number;
  declare type: 'approve' | 'disapprove';
  declare created_at: Date;
  declare updated_at: Date;
}

Vote.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    politician_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('approve', 'disapprove'), allowNull: false },
  },
  {
    sequelize,
    tableName: 'votes',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id', 'politician_id'] }],
  }
);

export default Vote;
