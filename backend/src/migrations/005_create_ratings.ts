import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('ratings', {
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
    attendance: { type: DataTypes.TINYINT, allowNull: false },
    project_quality: { type: DataTypes.TINYINT, allowNull: false },
    transparency: { type: DataTypes.TINYINT, allowNull: false },
    communication: { type: DataTypes.TINYINT, allowNull: false },
    average: { type: DataTypes.DECIMAL(3, 2) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('ratings', ['user_id', 'politician_id'], {
    unique: true,
    name: 'unique_rating',
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('ratings');
}
