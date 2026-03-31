import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('nepotism_alerts', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    politician_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'politicians', key: 'id' } },
    relative_name: { type: DataTypes.STRING(200), allowNull: false },
    relative_role: { type: DataTypes.STRING(200) },
    relationship: { type: DataTypes.STRING(100) },
    institution: { type: DataTypes.STRING(200) },
    evidence: { type: DataTypes.TEXT },
    source_url: { type: DataTypes.STRING(500) },
    source_title: { type: DataTypes.STRING(300) },
    confidence: { type: DataTypes.ENUM('alta', 'media', 'baixa'), defaultValue: 'media' },
    status: { type: DataTypes.ENUM('confirmado', 'suspeita', 'descartado'), defaultValue: 'suspeita' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('nepotism_alerts');
}
