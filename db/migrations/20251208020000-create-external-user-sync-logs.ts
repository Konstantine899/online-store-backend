import type { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;
    down(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;
}

const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        // ===== СОЗДАНИЕ ТАБЛИЦЫ external_user_sync_logs =====
        await queryInterface.createTable('external_user_sync_logs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Уникальный идентификатор лога синхронизации',
            },
            external_role_config_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'ID конфигурации внешней системы',
            },
            tenant_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'ID тенанта',
            },
            sync_type: {
                type: Sequelize.ENUM(
                    'FULL',
                    'INCREMENTAL',
                    'ON_DEMAND',
                    'SSO_LOGIN',
                ),
                allowNull: false,
                comment: 'Тип синхронизации',
            },
            trigger_type: {
                type: Sequelize.ENUM(
                    'SCHEDULED',
                    'MANUAL',
                    'SSO_LOGIN',
                    'WEBHOOK',
                ),
                allowNull: false,
                comment: 'Тип триггера синхронизации',
            },
            triggered_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'ID пользователя, запустившего синхронизацию',
            },
            status: {
                type: Sequelize.ENUM('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'),
                allowNull: false,
                defaultValue: 'RUNNING',
                comment: 'Статус синхронизации',
            },
            total_users: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Общее количество обработанных пользователей',
            },
            created_users: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество созданных пользователей',
            },
            updated_users: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество обновленных пользователей',
            },
            deleted_users: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество удаленных пользователей',
            },
            mapped_users: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество пользователей с примененным маппингом',
            },
            skipped_users: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество пропущенных пользователей',
            },
            failed_users: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество пользователей с ошибками',
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: false,
                comment: 'Время начала синхронизации',
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Время завершения синхронизации',
            },
            duration_ms: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Длительность синхронизации в миллисекундах',
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Сообщение об ошибке (если есть)',
            },
            error_details: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Детали ошибок (массив)',
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Дополнительная информация о синхронизации',
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

        // ===== ДОБАВЛЕНИЕ FOREIGN KEYS =====
        await Promise.all([
            queryInterface.addConstraint('external_user_sync_logs', {
                fields: ['external_role_config_id'],
                type: 'foreign key',
                name: 'fk_external_user_sync_logs_config_id',
                references: {
                    table: 'external_role_configs',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            }),
            queryInterface.addConstraint('external_user_sync_logs', {
                fields: ['tenant_id'],
                type: 'foreign key',
                name: 'fk_external_user_sync_logs_tenant_id',
                references: {
                    table: 'tenants',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            }),
            queryInterface.addConstraint('external_user_sync_logs', {
                fields: ['triggered_by'],
                type: 'foreign key',
                name: 'fk_external_user_sync_logs_triggered_by',
                references: {
                    table: 'user',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
        ]);

        // ===== СОЗДАНИЕ ИНДЕКСОВ =====
        await Promise.all([
            queryInterface.addIndex(
                'external_user_sync_logs',
                ['external_role_config_id'],
                {
                    name: 'idx_external_user_sync_logs_config_id',
                },
            ),
            queryInterface.addIndex('external_user_sync_logs', ['tenant_id'], {
                name: 'idx_external_user_sync_logs_tenant_id',
            }),
            queryInterface.addIndex('external_user_sync_logs', ['status'], {
                name: 'idx_external_user_sync_logs_status',
            }),
            queryInterface.addIndex('external_user_sync_logs', ['started_at'], {
                name: 'idx_external_user_sync_logs_started_at',
            }),
            queryInterface.addIndex(
                'external_user_sync_logs',
                ['trigger_type'],
                {
                    name: 'idx_external_user_sync_logs_trigger_type',
                },
            ),
            queryInterface.addIndex(
                'external_user_sync_logs',
                ['external_role_config_id', 'started_at'],
                {
                    name: 'idx_external_user_sync_logs_config_started',
                },
            ),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // ===== ROLLBACK: УДАЛЕНИЕ ТАБЛИЦЫ =====
        await queryInterface.dropTable('external_user_sync_logs');
    },
};

export default migration;
