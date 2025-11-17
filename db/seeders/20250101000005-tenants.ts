import type { QueryInterface } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface): Promise<void> => {
        // Проверяем существование default tenant (может быть создан миграцией)
        const [tenants] = await queryInterface.sequelize.query(
            `SELECT id FROM tenants WHERE id IN (1, 2)`,
        );

        const existingIds = (tenants as Array<{ id: number }>).map((t) => t.id);
        const tenantsToInsert = [];

        // Tenant 1 (production/default)
        if (!existingIds.includes(1)) {
            tenantsToInsert.push({
                id: 1,
                name: 'Default Tenant',
                subdomain: 'default',
                status: 'active',
                plan: 'free',
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Tenant 2 (для integration тестов tenant isolation)
        if (!existingIds.includes(2)) {
            tenantsToInsert.push({
                id: 2,
                name: 'Test Tenant 2',
                subdomain: 'test-tenant-2',
                status: 'active',
                plan: 'free',
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Вставляем только если есть что вставлять
        if (tenantsToInsert.length > 0) {
            await queryInterface.bulkInsert('tenants', tenantsToInsert);
            console.log(
                `✅ Created tenants: ${tenantsToInsert.map((t) => `id=${t.id}`).join(', ')}`,
            );
        } else {
            console.log('ℹ️  All tenants (id=1,2) already exist - skipping');
        }
    },

    down: async (queryInterface: QueryInterface): Promise<void> => {
        // ТОЛЬКО удаляем тестовый tenant 2, НЕ трогаем tenant 1 (production)
        await queryInterface.bulkDelete('tenants', {
            id: 2,
        });
    },
};
