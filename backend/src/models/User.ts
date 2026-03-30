import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  password_hash: string;
  role: 'citizen' | 'editor' | 'admin';
  city: string | null;
  verified: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'cpf' | 'role' | 'city' | 'verified'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare cpf: string | null;
  declare password_hash: string;
  declare role: 'citizen' | 'editor' | 'admin';
  declare city: string | null;
  declare verified: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    cpf: { type: DataTypes.STRING(14), unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('citizen', 'editor', 'admin'), defaultValue: 'citizen' },
    city: { type: DataTypes.STRING(100) },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'users', underscored: true }
);

export default User;
