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
        // ===== ШАГ 1: СОЗДАНИЕ ТАБЛИЦЫ user_roles =====
        await queryInterface.createTable('user_roles', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Уникальный идентификатор назначения роли',
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'ID пользователя (FK → user.id)',
            },
            role_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'roles',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'ID роли (FK → roles.id)',
            },
            tenant_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'ID тенанта (FK → tenants.id), для tenant-isolation',
            },
            granted_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'SET NULL',
                onDelete: 'SET NULL',
                comment:
                    'ID пользователя, который назначил роль (FK → user.id), NULL если системное назначение',
            },
            granted_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'Дата и время назначения роли',
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment:
                    'Дата и время истечения роли (NULL если роль бессрочная)',
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment:
                    'Активна ли роль (для soft delete или временного отключения)',
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
                comment:
                    'Дополнительные метаданные назначения роли (JSON объект)',
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

        // ===== ШАГ 2: ДОБАВЛЕНИЕ UNIQUE CONSTRAINT =====
        // Один пользователь может иметь одну роль только один раз в рамках одного тенанта
        await queryInterface.addConstraint('user_roles', {
            fields: ['user_id', 'role_id', 'tenant_id'],
            type: 'unique',
            name: 'uq_user_roles_user_role_tenant',
        });

        // ===== ШАГ 3: СОЗДАНИЕ ИНДЕКСОВ =====
        await Promise.all([
            // Индекс 1: user_id (для поиска всех ролей пользователя)
            queryInterface.addIndex('user_roles', ['user_id'], {
                name: 'idx_user_roles_user_id',
            }),

            // Индекс 2: role_id (для поиска всех пользователей с ролью)
            queryInterface.addIndex('user_roles', ['role_id'], {
                name: 'idx_user_roles_role_id',
            }),

            // Индекс 3: tenant_id (для фильтрации по тенанту)
            queryInterface.addIndex('user_roles', ['tenant_id'], {
                name: 'idx_user_roles_tenant_id',
            }),

            // Индекс 4: expires_at (для поиска истекающих ролей)
            queryInterface.addIndex('user_roles', ['expires_at'], {
                name: 'idx_user_roles_expires_at',
            }),

            // Индекс 5: is_active (для фильтрации активных назначений)
            queryInterface.addIndex('user_roles', ['is_active'], {
                name: 'idx_user_roles_is_active',
            }),

            // Индекс 6: granted_by (для аудита назначений)
            queryInterface.addIndex('user_roles', ['granted_by'], {
                name: 'idx_user_roles_granted_by',
            }),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // ===== ROLLBACK: УДАЛЕНИЕ ТАБЛИЦЫ user_roles =====
        // dropTable автоматически удаляет все индексы и constraints
        await queryInterface.dropTable('user_roles');
    },
};

export default migration;
