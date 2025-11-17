"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface) {
        const indexes = [
            {
                table: 'category',
                columns: ['tenant_id', 'name'],
                name: 'idx_category_tenant_id_name',
                comment: 'SAAS-003: Composite index for category sorting by name per tenant',
            },
            {
                table: 'brand',
                columns: ['tenant_id', 'name'],
                name: 'idx_brand_tenant_id_name',
                comment: 'SAAS-003: Composite index for brand sorting by name per tenant',
            },
        ];
        for (const index of indexes) {
            try {
                await queryInterface.addIndex(index.table, index.columns, {
                    name: index.name,
                });
                console.log(`✅ Created index ${index.name} on ${index.table}(${index.columns.join(',')})`);
            }
            catch {
                console.log(`⚠️  Index ${index.name} already exists on ${index.table} - skipping`);
            }
        }
    },
    async down(queryInterface) {
        const indexes = [
            { table: 'category', name: 'idx_category_tenant_id_name' },
            { table: 'brand', name: 'idx_brand_tenant_id_name' },
        ];
        for (const index of indexes) {
            try {
                await queryInterface.removeIndex(index.table, index.name);
                console.log(`✅ Removed index ${index.name} from ${index.table}`);
            }
            catch {
                console.log(`⚠️  Index ${index.name} does not exist on ${index.table}`);
            }
        }
    },
};
exports.default = migration;
