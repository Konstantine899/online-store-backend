"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('cart', 'tenant_id', {
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
        const indexes = [
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
                console.log(`Created index ${index.name} on ${index.table}(${index.columns.join(',')})`);
            }
            catch (error) {
                console.log(`Index ${index.name} already exists on ${index.table} - skipping`);
            }
        }
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('cart', 'tenant_id');
        await queryInterface.removeColumn('order', 'tenant_id');
        await queryInterface.removeColumn('rating', 'tenant_id');
    },
};
exports.default = migration;
