import { QueryInterface, DataTypes } from 'sequelize';

interface Migration {
  up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
    await queryInterface.createTable('product-property', {
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
      value: {
        type: Sequelize.STRING,
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

    await queryInterface.addColumn('product-property', 'product_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'product',
        key: 'id',
      },
      allowNull: false,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('product-property', 'product_id');
    await queryInterface.dropTable('product-property');
  },
};

export default migration;