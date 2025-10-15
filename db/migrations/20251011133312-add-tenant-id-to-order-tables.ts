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
        // Add tenant_id to cart table
        await queryInterface.addColumn('cart', 'tenant_id', {
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

        // Add tenant_id to order table
        await queryInterface.addColumn('order', 'tenant_id', {
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

        // Add tenant_id to rating table
        await queryInterface.addColumn('rating', 'tenant_id', {
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
            // Cart indexes
            {
                table: 'cart',
                columns: ['tenant_id'],
                name: 'idx_cart_tenant_id',
            },
            {
                table: 'cart',
                columns: ['tenant_id', 'id'],
                name: 'idx_cart_tenant_id_id',
            },
            {
                table: 'cart',
                columns: ['tenant_id', 'user_id'],
                name: 'idx_cart_tenant_id_user_id',
            },

            // Order indexes
            {
                table: 'order',
                columns: ['tenant_id'],
                name: 'idx_order_tenant_id',
            },
            {
                table: 'order',
                columns: ['tenant_id', 'id'],
                name: 'idx_order_tenant_id_id',
            },
            {
                table: 'order',
                columns: ['tenant_id', 'user_id'],
                name: 'idx_order_tenant_id_user_id',
            },
            {
                table: 'order',
                columns: ['tenant_id', 'status'],
                name: 'idx_order_tenant_id_status',
            },

            // Rating indexes
            {
                table: 'rating',
                columns: ['tenant_id'],
                name: 'idx_rating_tenant_id',
            },
            {
                table: 'rating',
                columns: ['tenant_id', 'id'],
                name: 'idx_rating_tenant_id_id',
            },
            {
                table: 'rating',
                columns: ['tenant_id', 'product_id'],
                name: 'idx_rating_tenant_id_product_id',
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
        await queryInterface.removeColumn('cart', 'tenant_id');
        await queryInterface.removeColumn('order', 'tenant_id');
        await queryInterface.removeColumn('rating', 'tenant_id');
    },
};

export default migration;
