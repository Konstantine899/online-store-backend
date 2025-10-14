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
        // Add tenant_id to product table
        await queryInterface.addColumn('product', 'tenant_id', {
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

        // Add tenant_id to category table
        await queryInterface.addColumn('category', 'tenant_id', {
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

        // Add tenant_id to brand table
        await queryInterface.addColumn('brand', 'tenant_id', {
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
            {
                table: 'product',
                columns: ['tenant_id'],
                name: 'idx_product_tenant_id',
            },
            {
                table: 'product',
                columns: ['tenant_id', 'id'],
                name: 'idx_product_tenant_id_id',
            },
            {
                table: 'product',
                columns: ['tenant_id', 'category_id'],
                name: 'idx_product_tenant_id_category_id',
            },
            {
                table: 'product',
                columns: ['tenant_id', 'brand_id'],
                name: 'idx_product_tenant_id_brand_id',
            },
            {
                table: 'category',
                columns: ['tenant_id'],
                name: 'idx_category_tenant_id',
            },
            {
                table: 'category',
                columns: ['tenant_id', 'id'],
                name: 'idx_category_tenant_id_id',
            },
            {
                table: 'brand',
                columns: ['tenant_id'],
                name: 'idx_brand_tenant_id',
            },
            {
                table: 'brand',
                columns: ['tenant_id', 'id'],
                name: 'idx_brand_tenant_id_id',
            },
            {
                table: 'brand',
                columns: ['tenant_id', 'category_id'],
                name: 'idx_brand_tenant_id_category_id',
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
        await queryInterface.removeColumn('product', 'tenant_id');
        await queryInterface.removeColumn('category', 'tenant_id');
        await queryInterface.removeColumn('brand', 'tenant_id');
    },
};

export default migration;
