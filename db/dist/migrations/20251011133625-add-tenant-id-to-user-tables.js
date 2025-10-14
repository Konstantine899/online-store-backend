"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('user_address', 'tenant_id', {
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
        const indexes = [
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
                console.log(`Created index ${index.name} on ${index.table}(${index.columns.join(',')})`);
            }
            catch (error) {
                console.log(`Index ${index.name} already exists on ${index.table} - skipping`);
            }
        }
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('user_address', 'tenant_id');
        await queryInterface.removeColumn('login_history', 'tenant_id');
    },
};
exports.default = migration;
