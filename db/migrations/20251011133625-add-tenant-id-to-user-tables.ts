import { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;

    down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        // Add tenant_id to user_address table
        await queryInterface.addColumn('user_address', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: true, // Nullable для backfill, станет NOT NULL позже
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Tenant ID (FK → tenants.id)',
        });

        // Add tenant_id to login_history table
        await queryInterface.addColumn('login_history', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Tenant ID (FK → tenants.id)',
        });

        // Add composite indexes for tenant-scoped queries (safe with try-catch)
        const indexes = [
            // User address indexes
            {
                table: 'user_address',
                columns: ['tenant_id'],
                name: 'idx_user_address_tenant_id',
            },
            {
                table: 'user_address',
                columns: ['tenant_id', 'id'],
                name: 'idx_user_address_tenant_id_id',
            },
            {
                table: 'user_address',
                columns: ['tenant_id', 'user_id'],
                name: 'idx_user_address_tenant_id_user_id',
            },

            // Login history indexes
            {
                table: 'login_history',
                columns: ['tenant_id'],
                name: 'idx_login_history_tenant_id',
            },
            {
                table: 'login_history',
                columns: ['tenant_id', 'id'],
                name: 'idx_login_history_tenant_id_id',
            },
            {
                table: 'login_history',
                columns: ['tenant_id', 'user_id'],
                name: 'idx_login_history_tenant_id_user_id',
            },
            {
                table: 'login_history',
                columns: ['tenant_id', 'login_at'],
                name: 'idx_login_history_tenant_id_login_at',
            },
        ];

        for (const index of indexes) {
            try {
                await queryInterface.addIndex(index.table, index.columns, {
                    name: index.name,
                });
                console.log(
                    `Created index ${index.name} on ${index.table}(${index.columns.join(',')})`,
                );
            } catch {
                console.log(
                    `Index ${index.name} already exists on ${index.table} - skipping`,
                );
            }
        }
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Drop columns (indexes will be dropped automatically with FK constraints)
        await queryInterface.removeColumn('user_address', 'tenant_id');
        await queryInterface.removeColumn('login_history', 'tenant_id');
    },
};

export default migration;

