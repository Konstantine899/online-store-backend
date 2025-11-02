import type { DataTypes, QueryInterface } from 'sequelize';
import { QueryTypes, DataTypes as SequelizeDataTypes } from 'sequelize';

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
        // Add tenant_id to notifications table
        await queryInterface.addColumn('notifications', 'tenant_id', {
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

        // Add composite indexes for tenant-scoped queries
        const indexes = [
            {
                table: 'notifications',
                columns: ['tenant_id', 'user_id'],
                name: 'idx_notifications_tenant_user',
            },
            {
                table: 'notifications',
                columns: ['tenant_id', 'type'],
                name: 'idx_notifications_tenant_type',
            },
            {
                table: 'notifications',
                columns: ['tenant_id', 'status'],
                name: 'idx_notifications_tenant_status',
            },
            {
                table: 'notifications',
                columns: ['tenant_id'],
                name: 'idx_notifications_tenant_id',
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
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                if (
                    !errorMessage.includes('already exists') &&
                    !errorMessage.includes('Duplicate key')
                ) {
                    throw error;
                }
                console.log(
                    `Index ${index.name} already exists on ${index.table} - skipping`,
                );
            }
        }

        // Step 3: Backfill tenant_id = 1 for existing notifications records
        // Получаем tenant_id из users через JOIN или берем default tenant
        await queryInterface.sequelize.query(
            `
            UPDATE notifications n
            INNER JOIN user u ON n.user_id = u.id
            SET n.tenant_id = COALESCE(u.tenant_id, 1)
            WHERE n.tenant_id IS NULL
        `,
        );

        // Если есть записи без связанного user, используем default tenant
        await queryInterface.sequelize.query(
            `UPDATE notifications SET tenant_id = 1 WHERE tenant_id IS NULL`,
        );

        console.log(
            'Backfilled notifications: tenant_id assigned from users or default',
        );

        // Step 4: Make tenant_id NOT NULL (enforce constraint)
        await queryInterface.changeColumn('notifications', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: false, // Now required!
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
        console.log('notifications.tenant_id is now NOT NULL');
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Step 1: Make tenant_id nullable again
        await queryInterface.changeColumn('notifications', 'tenant_id', {
            type: SequelizeDataTypes.INTEGER,
            allowNull: true, // Back to nullable
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        // Step 2: Clear tenant_id values
        await queryInterface.sequelize.query(
            `UPDATE notifications SET tenant_id = NULL`,
        );

        // Step 3: Remove indexes
        const indexesToRemove = [
            'idx_notifications_tenant_type',
            'idx_notifications_tenant_user',
            'idx_notifications_tenant_status',
            'idx_notifications_tenant_id',
        ];

        for (const indexName of indexesToRemove) {
            try {
                await queryInterface.removeIndex('notifications', indexName);
                console.log(`Removed index ${indexName}`);
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                if (
                    !errorMessage.includes('does not exist') &&
                    !errorMessage.includes('Unknown key')
                ) {
                    throw error;
                }
                console.log(`Index ${indexName} does not exist - skipping`);
            }
        }

        // Step 4: Remove foreign key constraint (find actual constraint name)
        try {
            const constraints = (await queryInterface.sequelize.query(
                `
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'notifications'
                    AND COLUMN_NAME = 'tenant_id'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1
            `,
                {
                    type: QueryTypes.SELECT,
                },
            )) as unknown as Array<{ CONSTRAINT_NAME: string }>;

            if (constraints && constraints.length > 0) {
                const constraintName = constraints[0].CONSTRAINT_NAME;
                await queryInterface.sequelize.query(
                    `ALTER TABLE notifications DROP FOREIGN KEY ${constraintName}`,
                );
                console.log(`Removed FK constraint ${constraintName}`);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            if (
                !errorMessage.includes('does not exist') &&
                !errorMessage.includes('Unknown key')
            ) {
                console.warn(`Could not remove FK constraint: ${errorMessage}`);
            }
        }

        // Step 5: Drop column
        await queryInterface.removeColumn('notifications', 'tenant_id');
        console.log('Removed tenant_id column from notifications table');
    },
};

export default migration;
