import { QueryInterface, DataTypes } from 'sequelize';

interface Migration {
  up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
    await queryInterface.createTable('cart-product', {
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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

    await queryInterface.addColumn('cart-product', 'cart_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'cart',
        key: 'id',
      },
    });

    await queryInterface.addColumn('cart-product', 'product_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'product',
        key: 'id',
      },
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('cart-product', 'cart_id');
    await queryInterface.removeColumn('cart-product', 'product_id');
    await queryInterface.dropTable('cart-product');
  },
};

export default migration;