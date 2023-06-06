'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.bulkInsert(`Role`, [
      {
        role: 'ADMIN',
        description: 'Администратор',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role: 'USER',
        description: 'Пользователь',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Role', null, {});
  },
};
