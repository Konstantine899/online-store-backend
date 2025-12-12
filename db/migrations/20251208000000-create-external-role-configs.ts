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
        // ===== СОЗДАНИЕ ТАБЛИЦЫ external_role_configs =====
        await queryInterface.createTable('external_role_configs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Уникальный идентификатор конфигурации',
            },
            tenant_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'ID тенанта',
            },
            provider_type: {
                type: Sequelize.ENUM(
                    'LDAP',
                    'AD',
                    'AZURE_AD',
                    'GOOGLE_WORKSPACE',
                    'OKTA',
                    'SAML',
                    'OIDC',
                    'GENERIC_OAUTH2',
                ),
                allowNull: false,
                comment: 'Тип провайдера внешней системы',
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Название конфигурации',
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Описание конфигурации',
            },
            provider_config: {
                type: Sequelize.JSON,
                allowNull: false,
                comment:
                    'Конфигурация провайдера (credentials, endpoints, etc.)',
            },
            sync_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Включена ли автоматическая синхронизация',
            },
            sync_schedule: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: '0 */6 * * *',
                comment: 'Cron выражение для автоматической синхронизации',
            },
            sync_mode: {
                type: Sequelize.ENUM('FULL', 'INCREMENTAL', 'ON_DEMAND'),
                allowNull: false,
                defaultValue: 'INCREMENTAL',
                comment: 'Режим синхронизации',
            },
            last_sync_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Время последней синхронизации',
            },
            next_sync_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Время следующей синхронизации',
            },
            credentials_encrypted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Шифрование credentials',
            },
            verify_ssl: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Проверять ли SSL сертификат',
            },
            timeout_ms: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 30000,
                comment: 'Таймаут запросов в миллисекундах',
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING'),
                allowNull: false,
                defaultValue: 'ACTIVE',
                comment: 'Статус конфигурации',
            },
            last_error: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Последняя ошибка синхронизации',
            },
            last_error_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Время последней ошибки',
            },
            error_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество ошибок',
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'ID пользователя, создавшего конфигурацию',
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'ID пользователя, обновившего конфигурацию',
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
            queryInterface.addConstraint('external_role_configs', {
                fields: ['tenant_id'],
                type: 'foreign key',
                name: 'fk_external_role_configs_tenant_id',
                references: {
                    table: 'tenants',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            }),
            queryInterface.addConstraint('external_role_configs', {
                fields: ['created_by'],
                type: 'foreign key',
                name: 'fk_external_role_configs_created_by',
                references: {
                    table: 'user',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addConstraint('external_role_configs', {
                fields: ['updated_by'],
                type: 'foreign key',
                name: 'fk_external_role_configs_updated_by',
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
            queryInterface.addIndex('external_role_configs', ['tenant_id'], {
                name: 'idx_external_role_configs_tenant_id',
            }),
            queryInterface.addIndex(
                'external_role_configs',
                ['provider_type'],
                {
                    name: 'idx_external_role_configs_provider_type',
                },
            ),
            queryInterface.addIndex('external_role_configs', ['status'], {
                name: 'idx_external_role_configs_status',
            }),
            queryInterface.addIndex('external_role_configs', ['sync_enabled'], {
                name: 'idx_external_role_configs_sync_enabled',
            }),
            queryInterface.addIndex('external_role_configs', ['next_sync_at'], {
                name: 'idx_external_role_configs_next_sync_at',
            }),
            queryInterface.addIndex(
                'external_role_configs',
                ['tenant_id', 'provider_type', 'name'],
                {
                    name: 'uk_external_role_configs_tenant_provider',
                    unique: true,
                },
            ),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // ===== ROLLBACK: УДАЛЕНИЕ ТАБЛИЦЫ =====
        // dropTable автоматически удаляет все индексы, FK и constraints
        await queryInterface.dropTable('external_role_configs');
    },
};

export default migration;
