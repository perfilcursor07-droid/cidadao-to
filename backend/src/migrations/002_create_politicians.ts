import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('politicians', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    role: { type: DataTypes.ENUM('governador', 'senador', 'dep_federal', 'dep_estadual', 'prefeito', 'vereador') },
    party: { type: DataTypes.STRING(50) },
    city: { type: DataTypes.STRING(100) },
    state: { type: DataTypes.STRING(2), defaultValue: 'TO' },
    bio: { type: DataTypes.TEXT },
    photo_url: { type: DataTypes.STRING(500) },
    tse_id: { type: DataTypes.STRING(50) },
    score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    total_votes: { type: DataTypes.INTEGER, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('politicians');
}
