import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('diario_analyses', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    edition: { type: DataTypes.STRING(50) },
    edition_date: { type: DataTypes.DATEONLY },
    raw_text: { type: DataTypes.TEXT('long') },
    summary: { type: DataTypes.TEXT },
    items: { type: DataTypes.JSON },
    alerts: { type: DataTypes.JSON },
    keywords: { type: DataTypes.JSON },
    ai_model: { type: DataTypes.STRING(80) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('diario_analyses');
}
