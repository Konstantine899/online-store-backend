"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tenants', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
                comment: 'Tenant name (must be unique)',
            },
            subdomain: {
                type: Sequelize.STRING(100),
                allowNull: true,
                unique: true,
                comment: 'Custom subdomain for tenant (e.g., "nike" for nike.mystore.com)',
            },
            status: {
                type: Sequelize.ENUM('active', 'suspended', 'deleted'),
                allowNull: false,
                defaultValue: 'active',
                comment: 'Tenant status',
            },
            plan: {
                type: Sequelize.ENUM('free', 'starter', 'professional', 'enterprise'),
                allowNull: false,
                defaultValue: 'free',
                comment: 'Subscription plan',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
        await Promise.all([
            queryInterface.addIndex('tenants', ['subdomain'], {
                name: 'idx_tenants_subdomain',
                unique: true,
            }),
            queryInterface.addIndex('tenants', ['status'], {
                name: 'idx_tenants_status',
            }),
            queryInterface.addIndex('tenants', ['plan'], {
                name: 'idx_tenants_plan',
            }),
            queryInterface.addIndex('tenants', ['status', 'plan'], {
                name: 'idx_tenants_status_plan',
            }),
        ]);
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
        await Promise.all([
            queryInterface.removeIndex('tenants', 'idx_tenants_subdomain'),
            queryInterface.removeIndex('tenants', 'idx_tenants_status'),
            queryInterface.removeIndex('tenants', 'idx_tenants_plan'),
            queryInterface.removeIndex('tenants', 'idx_tenants_status_plan'),
        ]);
        await queryInterface.dropTable('tenant_users');
        await queryInterface.dropTable('tenants');
    },
};
exports.default = migration;
