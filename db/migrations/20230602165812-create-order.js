'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
      email: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.FLOAT, allowNull: false },
      status: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.STRING(2200) },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addColumn(`order`, `userId`, {
      type: Sequelize.INTEGER,
      references: { model: `user`, key: `id` },
      allowNull: false,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn(`order`, `userId`);
    await queryInterface.dropTable('order');
  },
};
