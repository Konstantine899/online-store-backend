'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    // eslint-disable-next-line prettier/prettier
    async up(queryInterface): Promise<any> {
        return await queryInterface.bulkInsert('role', [
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

    async down(queryInterface): Promise<void> {
        await queryInterface.bulkDelete('role', null, {});
    },
};
