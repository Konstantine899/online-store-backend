'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user-role', {
      roleId: {
        type: Sequelize.INTEGER,
        references: { model: `role`, key: `id` },
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: `user`, key: `id` },
        allowNull: false,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('user-role');
  },
};
