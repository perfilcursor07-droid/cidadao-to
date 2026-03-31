import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('polls', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    options: { type: DataTypes.JSON, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    ends_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  await queryInterface.createTable('poll_votes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    poll_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'polls', key: 'id' } },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    option_index: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('poll_votes', ['poll_id', 'user_id'], { unique: true });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('poll_votes');
  await queryInterface.dropTable('polls');
}
