"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seeder = {
    async up(queryInterface) {
        await queryInterface.bulkDelete('role', {}, {});
        await queryInterface.bulkInsert('role', [
            {
                role: 'SUPER_ADMIN',
                description: 'Супер администратор платформы',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'PLATFORM_ADMIN',
                description: 'Администратор платформы',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'TENANT_OWNER',
                description: 'Владелец тенанта/магазина',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'TENANT_ADMIN',
                description: 'Администратор тенанта/магазина',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'MANAGER',
                description: 'Менеджер магазина',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'CONTENT_MANAGER',
                description: 'Контент-менеджер',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'CUSTOMER_SERVICE',
                description: 'Служба поддержки клиентов',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'VIP_CUSTOMER',
                description: 'VIP клиент',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'WHOLESALE',
                description: 'Оптовый покупатель',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'CUSTOMER',
                description: 'Обычный клиент',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'AFFILIATE',
                description: 'Партнер/аффилиат',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'GUEST',
                description: 'Гость (незарегистрированный пользователь)',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'ADMIN',
                description: 'Администратор (legacy)',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'USER',
                description: 'Пользователь (legacy)',
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
