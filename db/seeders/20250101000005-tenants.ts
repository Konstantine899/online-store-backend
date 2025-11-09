import type { QueryInterface } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface): Promise<void> => {
        // Проверяем существование default tenant (может быть создан миграцией)
        const [tenants] = await queryInterface.sequelize.query(
            `SELECT id FROM tenants WHERE id = 1`,
        );

        // Вставляем только если не существует
        if (tenants.length === 0) {
            await queryInterface.bulkInsert('tenants', [
                {
                    id: 1,
                    name: 'Default Tenant',
                    subdomain: 'default',
                    status: 'active',
                    plan: 'free',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]);
            console.log('✅ Created default tenant (id=1) via seed');
        } else {
            console.log('ℹ️  Default tenant (id=1) already exists - skipping');
        }
    },

    down: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.bulkDelete('tenants', {
            id: 1,
        });
    },
};
