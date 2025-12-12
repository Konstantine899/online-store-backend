import type { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;

    down(queryInterface: QueryInterface): Promise<void>;
}

/**
 * Миграция: Добавление tenant_id к таблице user
 *
 * Цель: Обеспечить multi-tenancy для основной таблицы пользователей
 * Порядок: Выполняется ДО backfill миграции
 */
const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        // Add tenant_id to user table
        await queryInterface.addColumn('user', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: true, // Nullable для backfill, станет NOT NULL в backfill миграции
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Tenant ID (FK → tenants.id)',
        });

        // Add composite indexes for tenant-scoped queries
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
        ];

        for (const index of indexes) {
            try {
                await queryInterface.addIndex('user', index.columns, {
                    name: index.name,
                });
                console.log(
                    `✓ Created index ${index.name} on user(${index.columns.join(',')})`,
                );
            } catch {
                console.log(
                    `⚠ Index ${index.name} already exists on user - skipping`,
                );
            }
        }

        console.log('✓ Added tenant_id column to user table');
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Drop indexes first
        const indexes = [
            'idx_user_tenant_id',
            'idx_user_tenant_id_id',
            'idx_user_tenant_id_email',
        ];

        for (const indexName of indexes) {
            try {
                await queryInterface.removeIndex('user', indexName);
            } catch {
                console.log(`⚠ Index ${indexName} not found - skipping`);
            }
        }

        // Drop column
        await queryInterface.removeColumn('user', 'tenant_id');
        console.log('✓ Removed tenant_id column from user table');
    },
};

export default migration;
