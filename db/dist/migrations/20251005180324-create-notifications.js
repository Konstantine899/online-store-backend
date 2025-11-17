"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            type: {
                type: Sequelize.ENUM('email', 'push'),
                allowNull: false,
            },
            template_name: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            data: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
                allowNull: false,
                defaultValue: 'pending',
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            read_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            failed_reason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_archived: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
        await queryInterface.addIndex('notifications', ['user_id'], {
            name: 'idx_notifications_user_id',
        });
        await queryInterface.addIndex('notifications', ['type'], {
            name: 'idx_notifications_type',
        });
        await queryInterface.addIndex('notifications', ['status'], {
            name: 'idx_notifications_status',
        });
        await queryInterface.addIndex('notifications', ['template_name'], {
            name: 'idx_notifications_template_name',
        });
        await queryInterface.addIndex('notifications', ['is_read'], {
            name: 'idx_notifications_is_read',
        });
        await queryInterface.addIndex('notifications', ['is_archived'], {
            name: 'idx_notifications_is_archived',
        });
        await queryInterface.addIndex('notifications', ['created_at'], {
            name: 'idx_notifications_created_at',
        });
        await queryInterface.addIndex('notifications', ['user_id', 'status'], {
            name: 'idx_notifications_user_status',
        });
        await queryInterface.createTable('notification_templates', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            type: {
                type: Sequelize.ENUM('email', 'push'),
                allowNull: false,
            },
            subject: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            variables: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: [],
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        await queryInterface.addIndex('notification_templates', ['name'], {
            name: 'idx_notification_templates_name',
            unique: true,
        });
        await queryInterface.addIndex('notification_templates', ['type'], {
            name: 'idx_notification_templates_type',
        });
        await queryInterface.addIndex('notification_templates', ['is_active'], {
            name: 'idx_notification_templates_is_active',
        });
    },
    async down(queryInterface) {
        const templateIndexesToRemove = [
            'idx_notification_templates_is_active',
            'idx_notification_templates_type',
            'idx_notification_templates_name',
        ];
        for (const indexName of templateIndexesToRemove) {
            try {
                await queryInterface.removeIndex('notification_templates', indexName);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (!errorMessage.includes('Unknown key') &&
                    !errorMessage.includes('does not exist') &&
                    !errorMessage.includes('Cannot drop')) {
                    throw error;
                }
            }
        }
        const indexesToRemove = [
            'idx_notifications_user_status',
            'idx_notifications_user_id',
            'idx_notifications_type',
            'idx_notifications_status',
            'idx_notifications_template_name',
            'idx_notifications_is_read',
            'idx_notifications_is_archived',
            'idx_notifications_created_at',
        ];
        for (const indexName of indexesToRemove) {
            try {
                await queryInterface.removeIndex('notifications', indexName);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (!errorMessage.includes('Unknown key') &&
                    !errorMessage.includes('does not exist') &&
                    !errorMessage.includes('Cannot drop')) {
                    throw error;
                }
            }
        }
        try {
            const constraints = (await queryInterface.sequelize.query(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'notifications'
                    AND COLUMN_NAME = 'user_id'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1
            `, {
                type: sequelize_1.QueryTypes.SELECT,
            }));
            if (constraints && constraints.length > 0) {
                const constraintName = constraints[0].CONSTRAINT_NAME;
                await queryInterface.sequelize.query(`ALTER TABLE notifications DROP FOREIGN KEY ${constraintName}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (!errorMessage.includes('Unknown key') &&
                !errorMessage.includes('does not exist') &&
                !errorMessage.includes('Cannot drop')) {
                console.warn(`[migrate] Could not remove FK constraint: ${errorMessage}`);
            }
        }
        await queryInterface.dropTable('notification_templates');
        await queryInterface.dropTable('notifications');
    },
};
exports.default = migration;
