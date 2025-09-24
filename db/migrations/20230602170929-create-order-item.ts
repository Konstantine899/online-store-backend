import { QueryInterface, DataTypes } from 'sequelize';

interface Migration {
  up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
    await queryInterface.createTable('order-item', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addColumn('order-item', 'order_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'order',
        key: 'id',
      },
      allowNull: false,
    });
// Добавляем индекс для быстрого поиска позиций заказа
await queryInterface.addIndex('order-item', ['order_id'], {
  name: 'idx_order_item_order_id'
});

  },

  async down(queryInterface: QueryInterface): Promise<void> {
      // Удаляем индекс
      await queryInterface.removeIndex('order-item', 'idx_order_item_order_id');
      
    await queryInterface.removeColumn('order-item', 'order_id');
    await queryInterface.dropTable('order-item');
  },
};

export default migration;