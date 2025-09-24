import { QueryInterface, DataTypes } from 'sequelize';

interface Migration {
  up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
    await queryInterface.createTable('cart', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
    // Индекс для быстрого поиска корзин (если понадобится)
   await queryInterface.addIndex('cart', ['id'], {
   name: 'idx_cart_id'
});
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Удаляем индекс
    await queryInterface.removeIndex('cart', 'idx_cart_id');
    
    await queryInterface.dropTable('cart');
  },
};

export default migration;