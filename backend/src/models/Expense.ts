import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ExpenseAttributes {
  id: number;
  politician_id: number;
  year: number;
  month: number;
  category: string;
  description: string | null;
  supplier: string | null;
  document_number: string | null;
  amount: number;
  source: string;
  external_id: string | null;
  created_at?: Date;
}

type ExpenseCreation = Optional<ExpenseAttributes, 'id' | 'description' | 'supplier' | 'document_number' | 'source' | 'external_id'>;

class Expense extends Model<ExpenseAttributes, ExpenseCreation> implements ExpenseAttributes {
  declare id: number;
  declare politician_id: number;
  declare year: number;
  declare month: number;
  declare category: string;
  declare description: string | null;
  declare supplier: string | null;
  declare document_number: string | null;
  declare amount: number;
  declare source: string;
  declare external_id: string | null;
  declare created_at: Date;
}

Expense.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  politician_id: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  supplier: { type: DataTypes.STRING(300) },
  document_number: { type: DataTypes.STRING(100) },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  source: { type: DataTypes.STRING(50), defaultValue: 'camara' },
  external_id: { type: DataTypes.STRING(100) },
}, { sequelize, tableName: 'expenses', underscored: true, updatedAt: false });

export default Expense;
