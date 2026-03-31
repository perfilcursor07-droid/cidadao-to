import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PollVoteAttributes {
  id: number;
  poll_id: number;
  user_id: number;
  option_index: number;
  created_at?: Date;
}

type PollVoteCreation = Optional<PollVoteAttributes, 'id'>;

class PollVote extends Model<PollVoteAttributes, PollVoteCreation> implements PollVoteAttributes {
  declare id: number;
  declare poll_id: number;
  declare user_id: number;
  declare option_index: number;
}

PollVote.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    poll_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    option_index: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'poll_votes', underscored: true, updatedAt: false }
);

export default PollVote;
