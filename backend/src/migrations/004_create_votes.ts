import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('votes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    politician_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'politicians', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: { type: DataTypes.ENUM('approve', 'disapprove'), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('votes', ['user_id', 'politician_id'], {
    unique: true,
    name: 'unique_vote',
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('votes');
}
