"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seeder = {
    async up(queryInterface) {
        await queryInterface.bulkInsert('role', [
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
        await queryInterface.bulkDelete('role', {}, {});
    },
};
exports.default = seeder;
