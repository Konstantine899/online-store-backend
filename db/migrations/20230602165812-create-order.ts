import { QueryInterface, DataTypes } from 'sequelize';

interface Migration {
  up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
    await queryInterface.createTable('order', {
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
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: { 
        type: Sequelize.STRING(2200) 
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

    await queryInterface.addColumn('order', 'user_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'user',
        key: 'id',
      },
      allowNull: false,
    });
     // Добавляем индексы для производительности
     await queryInterface.addIndex('order', ['user_id'], {
      name: 'idx_order_user_id'
    });

    await queryInterface.addIndex('order', ['status'], {
      name: 'idx_order_status'
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
     // Удаляем индексы
     await queryInterface.removeIndex('order', 'idx_order_status');
     await queryInterface.removeIndex('order', 'idx_order_user_id');
     
    await queryInterface.removeColumn('order', 'user_id');
    await queryInterface.dropTable('order');
  },
};

export default migration;