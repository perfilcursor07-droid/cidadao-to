import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NepotismAlertAttributes {
  id: number;
  politician_id: number;
  relative_name: string;
  relative_role: string | null;
  relationship: string | null;
  institution: string | null;
  evidence: string | null;
  source_url: string | null;
  source_title: string | null;
  confidence: 'alta' | 'media' | 'baixa';
  status: 'confirmado' | 'suspeita' | 'descartado';
  created_at?: Date;
  updated_at?: Date;
}

type NepotismCreation = Optional<NepotismAlertAttributes, 'id' | 'relative_role' | 'relationship' | 'institution' | 'evidence' | 'source_url' | 'source_title' | 'confidence' | 'status'>;

class NepotismAlert extends Model<NepotismAlertAttributes, NepotismCreation> implements NepotismAlertAttributes {
  declare id: number;
  declare politician_id: number;
  declare relative_name: string;
  declare relative_role: string | null;
  declare relationship: string | null;
  declare institution: string | null;
  declare evidence: string | null;
  declare source_url: string | null;
  declare source_title: string | null;
  declare confidence: 'alta' | 'media' | 'baixa';
  declare status: 'confirmado' | 'suspeita' | 'descartado';
}

NepotismAlert.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    politician_id: { type: DataTypes.INTEGER, allowNull: false },
    relative_name: { type: DataTypes.STRING(200), allowNull: false },
    relative_role: { type: DataTypes.STRING(200) },
    relationship: { type: DataTypes.STRING(100) },
    institution: { type: DataTypes.STRING(200) },
    evidence: { type: DataTypes.TEXT },
    source_url: { type: DataTypes.STRING(500) },
    source_title: { type: DataTypes.STRING(300) },
    confidence: { type: DataTypes.ENUM('alta', 'media', 'baixa'), defaultValue: 'media' },
    status: { type: DataTypes.ENUM('confirmado', 'suspeita', 'descartado'), defaultValue: 'suspeita' },
  },
  { sequelize, tableName: 'nepotism_alerts', underscored: true }
);

export default NepotismAlert;
