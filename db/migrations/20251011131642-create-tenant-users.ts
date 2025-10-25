import type { DataTypes, QueryInterface } from 'sequelize';

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

        // Indexes for performance
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
        // Drop table (will cascade drop all indexes and constraints automatically)
        await queryInterface.dropTable('tenant_users');
    },
};

export default migration;
