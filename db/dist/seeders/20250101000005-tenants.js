"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface) => {
        const [tenants] = await queryInterface.sequelize.query(`SELECT id FROM tenants WHERE id IN (1, 2)`);
        const existingIds = tenants.map((t) => t.id);
        const tenantsToInsert = [];
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
        if (tenantsToInsert.length > 0) {
            await queryInterface.bulkInsert('tenants', tenantsToInsert);
            console.log(`✅ Created tenants: ${tenantsToInsert.map((t) => `id=${t.id}`).join(', ')}`);
        }
        else {
            console.log('ℹ️  All tenants (id=1,2) already exist - skipping');
        }
    },
    down: async (queryInterface) => {
        await queryInterface.bulkDelete('tenants', {
            id: 2,
        });
    },
};
