import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('expenses', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    politician_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'politicians', key: 'id' }, onDelete: 'CASCADE' },
    year: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    supplier: { type: DataTypes.STRING(300) },
    document_number: { type: DataTypes.STRING(100) },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    source: { type: DataTypes.STRING(50), defaultValue: 'camara' },
    external_id: { type: DataTypes.STRING(100) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });
  await queryInterface.addIndex('expenses', ['politician_id', 'year', 'month']);
  await queryInterface.addIndex('expenses', ['external_id'], { unique: true });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('expenses');
}
