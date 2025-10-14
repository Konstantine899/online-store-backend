import { QueryInterface } from 'sequelize';

/**
 * SAAS-001 Performance Optimization: Add missing indexes for tenant-scoped queries
 *
 * Индексы для критичных операций:
 * 1. LoginHistory: security queries (IP tracking, failed logins)
 * 2. Product: sorting and pagination
 * 3. Order: date filtering and sorting
 */
const migration = {
    async up(queryInterface: QueryInterface): Promise<void> {
        const indexes = [
            // LoginHistory: для findRecentLoginsByIp (security)
            {
                table: 'login_history',
                columns: ['tenant_id', 'ip_address', 'login_at'],
                name: 'idx_login_history_tenant_id_ip_login_at',
                comment: 'Security: recent logins by IP per tenant',
            },
            // LoginHistory: для findFailedLoginsByUser (brute-force detection)
            {
                table: 'login_history',
                columns: ['tenant_id', 'success', 'login_at'],
                name: 'idx_login_history_tenant_id_success_login_at',
                comment: 'Security: failed login tracking per tenant',
            },
            // Product: для сортировки по имени в findListProduct
            {
                table: 'product',
                columns: ['tenant_id', 'name'],
                name: 'idx_product_tenant_id_name',
                comment: 'Performance: product sorting by name per tenant',
            },
            // Order: для фильтрации и сортировки по дате создания
            {
                table: 'order',
                columns: ['tenant_id', 'created_at'],
                name: 'idx_order_tenant_id_created_at',
                comment:
                    'Performance: order date filtering and sorting per tenant',
            },
        ];

        for (const index of indexes) {
            try {
                await queryInterface.addIndex(index.table, index.columns, {
                    name: index.name,
                });
                console.log(
                    `✅ Created index ${index.name} on ${index.table}(${index.columns.join(',')})`,
                );
            } catch (error) {
                console.log(
                    `⚠️  Index ${index.name} already exists on ${index.table} - skipping`,
                );
            }
        }
    },

    async down(queryInterface: QueryInterface): Promise<void> {
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
                console.log(
                    `✅ Removed index ${index.name} from ${index.table}`,
                );
            } catch (error) {
                console.log(
                    `⚠️  Index ${index.name} does not exist on ${index.table}`,
                );
            }
        }
    },
};

export default migration;
