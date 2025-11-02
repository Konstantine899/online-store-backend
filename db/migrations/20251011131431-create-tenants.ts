import type { QueryInterface, DataTypes } from 'sequelize';

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
                comment:
                    'Custom subdomain for tenant (e.g., "nike" for nike.mystore.com)',
            },
            status: {
                type: Sequelize.ENUM('active', 'suspended', 'deleted'),
                allowNull: false,
                defaultValue: 'active',
                comment: 'Tenant status',
            },
            plan: {
                type: Sequelize.ENUM(
                    'free',
                    'starter',
                    'professional',
                    'enterprise',
                ),
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

        // Indexes for performance
        await Promise.all([
            // Unique index on subdomain (already unique constraint, but explicit)
            queryInterface.addIndex('tenants', ['subdomain'], {
                name: 'idx_tenants_subdomain',
                unique: true,
            }),

            // Index for filtering by status
            queryInterface.addIndex('tenants', ['status'], {
                name: 'idx_tenants_status',
            }),

            // Index for plan-based queries (billing, analytics)
            queryInterface.addIndex('tenants', ['plan'], {
                name: 'idx_tenants_plan',
            }),

            // Composite index for active tenants by plan
            queryInterface.addIndex('tenants', ['status', 'plan'], {
                name: 'idx_tenants_status_plan',
            }),
        ]);

        // Создание таблицы tenant_users (связь многие-ко-многим между tenants и users)
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

        // Indexes for tenant_users performance
        await Promise.all([
            // Index for finding all tenants for a user
            queryInterface.addIndex('tenant_users', ['user_id'], {
                name: 'idx_tenant_users_user_id',
            }),

            // Index for finding all users in a tenant
            queryInterface.addIndex('tenant_users', ['tenant_id'], {
                name: 'idx_tenant_users_tenant_id',
            }),

            // Composite index for tenant+role queries (e.g., find all admins in tenant)
            queryInterface.addIndex('tenant_users', ['tenant_id', 'role'], {
                name: 'idx_tenant_users_tenant_id_role',
            }),

            // Composite index for user+role queries
            queryInterface.addIndex('tenant_users', ['user_id', 'role'], {
                name: 'idx_tenant_users_user_id_role',
            }),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Drop indexes first
        await Promise.all([
            queryInterface.removeIndex('tenants', 'idx_tenants_subdomain'),
            queryInterface.removeIndex('tenants', 'idx_tenants_status'),
            queryInterface.removeIndex('tenants', 'idx_tenants_plan'),
            queryInterface.removeIndex('tenants', 'idx_tenants_status_plan'),
        ]);

        // Drop tenant_users table first (it has FK to tenants)
        await queryInterface.dropTable('tenant_users');

        // Drop table
        await queryInterface.dropTable('tenants');
    },
};

export default migration;
