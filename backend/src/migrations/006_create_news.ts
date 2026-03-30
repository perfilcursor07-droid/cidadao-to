import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('news', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT('long') },
    category: { type: DataTypes.STRING(80) },
    author_id: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    published: { type: DataTypes.BOOLEAN, defaultValue: false },
    cover_emoji: { type: DataTypes.STRING(10) },
    cover_color: { type: DataTypes.STRING(20) },
    published_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('news');
}
