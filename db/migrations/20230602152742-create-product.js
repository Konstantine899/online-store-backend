'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product', {
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
      price: { type: Sequelize.FLOAT, allowNull: false },
      rating: { type: Sequelize.INTEGER, defaultValue: 0 },
      image: { type: Sequelize.STRING, allowNull: false },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addColumn(`product`, `categoryId`, {
      type: Sequelize.INTEGER,
      references: { model: `category`, key: `id` },
      allowNull: false,
    });
    await queryInterface.addColumn(`product`, `brandId`, {
      type: Sequelize.INTEGER,
      references: { model: `brand`, key: `id` },
      allowNull: false,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn(`product`, `brandId`);
    await queryInterface.removeColumn(`product`, `categoryId`);
    await queryInterface.dropTable('product');
  },
};
