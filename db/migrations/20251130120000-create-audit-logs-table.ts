import type { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;
    down(queryInterface: QueryInterface): Promise<void>;
}

/**
 * Миграция для создания таблицы audit_logs
 * Отслеживает все изменения в системе с детальной информацией
 */
const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        await queryInterface.createTable('audit_logs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: 'Тип сущности (role, user_role, role_permission)',
            },
            entity_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'ID сущности',
            },
            action: {
                type: Sequelize.ENUM(
                    'CREATE',
                    'UPDATE',
                    'DELETE',
                    'ASSIGN',
                    'REVOKE',
                    'GRANT_PERMISSION',
                    'REVOKE_PERMISSION',
                    'LOGIN',
                    'LOGOUT',
                ),
                allowNull: false,
                comment: 'Тип действия',
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment:
                    'ID пользователя, выполнившего действие (null для системных операций)',
            },
            old_values: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Старые значения (для UPDATE, DELETE)',
            },
            new_values: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Новые значения (для CREATE, UPDATE)',
            },
            ip_address: {
                type: Sequelize.STRING(45), // IPv6 max length
                allowNull: true,
                comment: 'IP адрес пользователя',
            },
            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'User-Agent браузера',
            },
            request_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Correlation ID для трассировки запросов',
            },
            tenant_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment: 'ID тенанта для tenant isolation',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'Timestamp операции',
            },
        });

        // Создание индексов для оптимизации запросов
        await queryInterface.addIndex(
            'audit_logs',
            ['entity_type', 'entity_id'],
            {
                name: 'idx_audit_logs_entity',
            },
        );

        await queryInterface.addIndex('audit_logs', ['action'], {
            name: 'idx_audit_logs_action',
        });

        await queryInterface.addIndex('audit_logs', ['user_id'], {
            name: 'idx_audit_logs_user_id',
        });

        await queryInterface.addIndex('audit_logs', ['tenant_id'], {
            name: 'idx_audit_logs_tenant_id',
        });

        await queryInterface.addIndex('audit_logs', ['created_at'], {
            name: 'idx_audit_logs_created_at',
        });

        await queryInterface.addIndex('audit_logs', ['request_id'], {
            name: 'idx_audit_logs_request_id',
        });

        // Композитный индекс для tenant-specific запросов с сортировкой по дате
        await queryInterface.addIndex(
            'audit_logs',
            ['tenant_id', 'created_at'],
            {
                name: 'idx_audit_logs_tenant_created',
            },
        );
    },
    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаление индексов
        await queryInterface.removeIndex(
            'audit_logs',
            'idx_audit_logs_tenant_created',
        );
        await queryInterface.removeIndex(
            'audit_logs',
            'idx_audit_logs_request_id',
        );
        await queryInterface.removeIndex(
            'audit_logs',
            'idx_audit_logs_created_at',
        );
        await queryInterface.removeIndex(
            'audit_logs',
            'idx_audit_logs_tenant_id',
        );
        await queryInterface.removeIndex(
            'audit_logs',
            'idx_audit_logs_user_id',
        );
        await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_action');
        await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_entity');

        // Удаление таблицы
        await queryInterface.dropTable('audit_logs');
    },
};

export default migration;
