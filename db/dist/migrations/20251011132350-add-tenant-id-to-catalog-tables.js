"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('product', 'tenant_id', {
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
                console.log(`Created index ${index.name} on ${index.table}(${index.columns.join(',')})`);
            }
            catch (error) {
                console.log(`Index ${index.name} already exists on ${index.table} - skipping`);
            }
        }
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('product', 'tenant_id');
        await queryInterface.removeColumn('category', 'tenant_id');
        await queryInterface.removeColumn('brand', 'tenant_id');
    },
};
exports.default = migration;
