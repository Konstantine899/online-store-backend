"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface) {
        const indexes = [
            {
                table: 'login_history',
                columns: ['tenant_id', 'ip_address', 'login_at'],
                name: 'idx_login_history_tenant_id_ip_login_at',
                comment: 'Security: recent logins by IP per tenant',
            },
            {
                table: 'login_history',
                columns: ['tenant_id', 'success', 'login_at'],
                name: 'idx_login_history_tenant_id_success_login_at',
                comment: 'Security: failed login tracking per tenant',
            },
            {
                table: 'product',
                columns: ['tenant_id', 'name'],
                name: 'idx_product_tenant_id_name',
                comment: 'Performance: product sorting by name per tenant',
            },
            {
                table: 'order',
                columns: ['tenant_id', 'created_at'],
                name: 'idx_order_tenant_id_created_at',
                comment: 'Performance: order date filtering and sorting per tenant',
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
            {
                table: 'login_history',
                name: 'idx_login_history_tenant_id_ip_login_at',
            },
            {
                table: 'login_history',
                name: 'idx_login_history_tenant_id_success_login_at',
            },
            { table: 'product', name: 'idx_product_tenant_id_name' },
            { table: 'order', name: 'idx_order_tenant_id_created_at' },
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
