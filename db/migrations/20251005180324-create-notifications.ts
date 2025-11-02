import type { QueryInterface, DataTypes } from 'sequelize';
import { QueryTypes } from 'sequelize';

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
        // Создание таблицы notifications (SAAS-009-01)
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
                type: Sequelize.ENUM(
                    'pending',
                    'sent',
                    'delivered',
                    'read',
                    'failed',
                ),
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

        // Создание индексов для производительности
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

        // Создание таблицы notification_templates
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

        // Создание индексов для notification_templates
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

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаление индексов notification_templates
        const templateIndexesToRemove = [
            'idx_notification_templates_is_active',
            'idx_notification_templates_type',
            'idx_notification_templates_name',
        ];

        for (const indexName of templateIndexesToRemove) {
            try {
                await queryInterface.removeIndex(
                    'notification_templates',
                    indexName,
                );
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                if (
                    !errorMessage.includes('Unknown key') &&
                    !errorMessage.includes('does not exist') &&
                    !errorMessage.includes('Cannot drop')
                ) {
                    throw error;
                }
            }
        }

        // Удаление индексов notifications (сначала композитный с user_id, затем остальные)
        const indexesToRemove = [
            'idx_notifications_user_status', // Композитный индекс с user_id
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
            } catch (error) {
                // Игнорируем ошибки, если индекс уже удален или не существует
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                if (
                    !errorMessage.includes('Unknown key') &&
                    !errorMessage.includes('does not exist') &&
                    !errorMessage.includes('Cannot drop')
                ) {
                    throw error;
                }
            }
        }

        // Динамическое удаление foreign key constraint
        // Ищем реальное имя констрейнта через запрос к information_schema
        try {
            const constraints = (await queryInterface.sequelize.query(
                `
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'notifications'
                    AND COLUMN_NAME = 'user_id'
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
            }
        } catch (error) {
            // Если FK уже удален или не существует, игнорируем ошибку
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            if (
                !errorMessage.includes('Unknown key') &&
                !errorMessage.includes('does not exist') &&
                !errorMessage.includes('Cannot drop')
            ) {
                // Логируем предупреждение, но не прерываем выполнение
                console.warn(
                    `[migrate] Could not remove FK constraint: ${errorMessage}`,
                );
            }
        }

        // Удаление таблиц (автоматически удалит все оставшиеся колонки)
        await queryInterface.dropTable('notification_templates');
        await queryInterface.dropTable('notifications');
    },
};

export default migration;
