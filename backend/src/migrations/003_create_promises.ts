import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('promises', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    politician_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'politicians', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    area: { type: DataTypes.STRING(100) },
    status: { type: DataTypes.ENUM('pending', 'progress', 'done', 'failed'), defaultValue: 'pending' },
    progress_pct: { type: DataTypes.INTEGER, defaultValue: 0 },
    source_url: { type: DataTypes.STRING(500) },
    deadline: { type: DataTypes.DATEONLY },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('promises');
}
