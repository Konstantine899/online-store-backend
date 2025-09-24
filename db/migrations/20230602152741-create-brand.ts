import { QueryInterface, DataTypes } from 'sequelize';

interface Migration {
  up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
    await queryInterface.createTable('brand', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        unique: true,
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

    await queryInterface.addColumn('brand', 'category_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'category',
        key: 'id',
      },
      allowNull: false,
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('brand', 'category_id');
    await queryInterface.dropTable('brand');
  },
};

export default migration;