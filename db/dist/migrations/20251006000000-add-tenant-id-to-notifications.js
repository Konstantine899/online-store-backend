"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('notifications', 'tenant_id', {
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
                console.log(`Created index ${index.name} on ${index.table}(${index.columns.join(',')})`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (!errorMessage.includes('already exists') &&
                    !errorMessage.includes('Duplicate key')) {
                    throw error;
                }
                console.log(`Index ${index.name} already exists on ${index.table} - skipping`);
            }
        }
        await queryInterface.sequelize.query(`UPDATE notifications SET tenant_id = 1 WHERE tenant_id IS NULL`);
        console.log('Backfilled notifications: tenant_id assigned from users or default');
        await queryInterface.changeColumn('notifications', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
        console.log('notifications.tenant_id is now NOT NULL');
    },
    async down(queryInterface) {
        await queryInterface.changeColumn('notifications', 'tenant_id', {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
        await queryInterface.sequelize.query(`UPDATE notifications SET tenant_id = NULL`);
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (!errorMessage.includes('does not exist') &&
                    !errorMessage.includes('Unknown key')) {
                    throw error;
                }
                console.log(`Index ${indexName} does not exist - skipping`);
            }
        }
        try {
            const constraints = (await queryInterface.sequelize.query(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'notifications'
                    AND COLUMN_NAME = 'tenant_id'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1
            `, {
                type: sequelize_1.QueryTypes.SELECT,
            }));
            if (constraints && constraints.length > 0) {
                const constraintName = constraints[0].CONSTRAINT_NAME;
                await queryInterface.sequelize.query(`ALTER TABLE notifications DROP FOREIGN KEY ${constraintName}`);
                console.log(`Removed FK constraint ${constraintName}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (!errorMessage.includes('does not exist') &&
                !errorMessage.includes('Unknown key')) {
                console.warn(`Could not remove FK constraint: ${errorMessage}`);
            }
        }
        await queryInterface.removeColumn('notifications', 'tenant_id');
        console.log('Removed tenant_id column from notifications table');
    },
};
exports.default = migration;
