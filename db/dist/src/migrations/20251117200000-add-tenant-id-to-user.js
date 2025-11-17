"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const migration = {
    async up(queryInterface) {
        await queryInterface.addColumn('user', 'tenant_id', {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
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
                columns: ['tenant_id'],
                name: 'idx_user_tenant_id',
            },
            {
                columns: ['tenant_id', 'id'],
                name: 'idx_user_tenant_id_id',
            },
            {
                columns: ['tenant_id', 'email'],
                name: 'idx_user_tenant_id_email',
            },
            {
                columns: ['tenant_id', 'is_active'],
                name: 'idx_user_tenant_id_is_active',
            },
            {
                columns: ['tenant_id', 'is_deleted'],
                name: 'idx_user_tenant_id_is_deleted',
            },
        ];
        for (const index of indexes) {
            try {
                await queryInterface.addIndex('user', index.columns, {
                    name: index.name,
                });
                console.log(`Created index ${index.name} on user(${index.columns.join(',')})`);
            }
            catch (error) {
                const err = error;
                console.log(`Index ${index.name} already exists on user - skipping: ${err.message ?? 'Unknown error'}`);
            }
        }
    },
    async down(queryInterface) {
        const indexes = [
            'idx_user_tenant_id',
            'idx_user_tenant_id_id',
            'idx_user_tenant_id_email',
            'idx_user_tenant_id_is_active',
            'idx_user_tenant_id_is_deleted',
        ];
        for (const indexName of indexes) {
            try {
                await queryInterface.removeIndex('user', indexName);
            }
            catch (error) {
                const err = error;
                console.warn(`Failed to remove index ${indexName}: ${err.message ?? 'Unknown error'}`);
            }
        }
        await queryInterface.removeColumn('user', 'tenant_id');
    },
};
exports.default = migration;
