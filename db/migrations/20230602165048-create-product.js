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
      categoryId: { type: Sequelize.INTEGER, allowNull: false },
      brandId: { type: Sequelize.INTEGER, allowNull: false },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('product');
  },
};
