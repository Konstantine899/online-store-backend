import type { QueryInterface } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface): Promise<void> => {
        // Идемпотентность: очищаем существующие записи перед вставкой
        await queryInterface.bulkDelete('tenants', { id: 1 }, {});

        await queryInterface.bulkInsert('tenants', [
            {
                id: 1,
                name: 'Default Tenant',
                subdomain: 'default',
                status: 'active',
                plan: 'basic',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },

    down: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.bulkDelete('tenants', {
            id: 1,
        });
    },
};
