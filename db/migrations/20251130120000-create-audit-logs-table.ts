import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Миграция для создания таблицы audit_logs
 * Отслеживает все изменения в системе с детальной информацией
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('audit_logs', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        entity_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Тип сущности (role, user_role, role_permission)',
        },
        entity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'ID сущности',
        },
        action: {
            type: DataTypes.ENUM(
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
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment:
                'ID пользователя, выполнившего действие (null для системных операций)',
        },
        old_values: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Старые значения (для UPDATE, DELETE)',
        },
        new_values: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Новые значения (для CREATE, UPDATE)',
        },
        ip_address: {
            type: DataTypes.INET,
            allowNull: true,
            comment: 'IP адрес пользователя',
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'User-Agent браузера',
        },
        request_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Correlation ID для трассировки запросов',
        },
        tenant_id: {
            type: DataTypes.INTEGER,
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
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Timestamp операции',
        },
    });

    // Создание индексов для оптимизации запросов
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], {
        name: 'idx_audit_logs_entity',
    });

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
    await queryInterface.addIndex('audit_logs', ['tenant_id', 'created_at'], {
        name: 'idx_audit_logs_tenant_created',
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
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
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_tenant_id');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_user_id');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_action');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_entity');

    // Удаление таблицы
    await queryInterface.dropTable('audit_logs');
}

