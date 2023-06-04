'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
      price: { type: Sequelize.FLOAT, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addColumn(`order-item`, `orderId`, {
      type: Sequelize.INTEGER,
      references: { model: `order`, key: `id` },
      allowNull: false,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn(`order-item`, `orderId`);
    await queryInterface.dropTable('order-item');
  },
};
