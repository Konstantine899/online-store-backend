"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tenant_users', {
            tenant_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'Tenant ID (FK → tenants.id)',
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'User ID (FK → user.id)',
            },
            role: {
                type: Sequelize.ENUM('owner', 'admin', 'member'),
                allowNull: false,
                defaultValue: 'member',
                comment: 'User role within tenant (owner/admin/member)',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
        await Promise.all([
            queryInterface.addIndex('tenant_users', ['user_id'], {
                name: 'idx_tenant_users_user_id',
            }),
            queryInterface.addIndex('tenant_users', ['tenant_id'], {
                name: 'idx_tenant_users_tenant_id',
            }),
            queryInterface.addIndex('tenant_users', ['tenant_id', 'role'], {
                name: 'idx_tenant_users_tenant_id_role',
            }),
            queryInterface.addIndex('tenant_users', ['user_id', 'role'], {
                name: 'idx_tenant_users_user_id_role',
            }),
        ]);
    },
    async down(queryInterface) {
        await queryInterface.dropTable('tenant_users');
    },
};
exports.default = migration;
