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
        // ===== ШАГ 1: УДАЛЕНИЕ СТАРЫХ ТАБЛИЦ =====
        // Удаляем user_role первой (она зависит от role через FK)
        await queryInterface.dropTable('user_role');
        // Удаляем role
        await queryInterface.dropTable('role');

        // ===== ШАГ 2: СОЗДАНИЕ НОВОЙ ТАБЛИЦЫ roles =====
        await queryInterface.createTable('roles', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Уникальный идентификатор роли',
            },
            role: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
                comment:
                    'Название роли (SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, и т.д.)',
            },
            description: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Описание роли (max 200 символов)',
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Уровень иерархии роли (0-100, где 100 - SUPER_ADMIN)',
            },
            permissions: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
                comment:
                    'Массив разрешений роли в формате JSON (resources, actions)',
            },
            is_system_role: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment:
                    'Системная роль (true) или tenant-specific роль (false)',
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Активна ли роль (для soft delete)',
            },
            tenant_id: {
                type: Sequelize.INTEGER,
                allowNull: true, // Nullable для системных ролей
                comment:
                    'ID тенанта (NULL для системных ролей, NOT NULL для tenant-specific)',
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

        // ===== ШАГ 3: ДОБАВЛЕНИЕ FOREIGN KEY =====
        // Добавляем FK к tenants
        // ВАЖНО: CHECK constraint (is_system_role + tenant_id) не добавляется из-за ограничения MySQL
        // (нельзя использовать CHECK constraint на колонке с FK). Логика валидируется на уровне приложения:
        // - Системные роли (is_system_role=TRUE) должны иметь tenant_id=NULL
        // - Tenant-specific роли (is_system_role=FALSE) должны иметь tenant_id NOT NULL
        await queryInterface.addConstraint('roles', {
            fields: ['tenant_id'],
            type: 'foreign key',
            name: 'fk_roles_tenant_id',
            references: {
                table: 'tenants',
                field: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        // ===== ШАГ 4: СОЗДАНИЕ ИНДЕКСОВ =====
        await Promise.all([
            // Индекс 1: level (для сортировки по иерархии)
            queryInterface.addIndex('roles', ['level'], {
                name: 'idx_roles_level',
            }),

            // Индекс 2: tenant_id (для фильтрации по тенанту)
            queryInterface.addIndex('roles', ['tenant_id'], {
                name: 'idx_roles_tenant_id',
            }),

            // Индекс 3: is_system_role (для быстрого разделения системных/tenant ролей)
            queryInterface.addIndex('roles', ['is_system_role'], {
                name: 'idx_roles_is_system_role',
            }),

            // Индекс 4: is_active (для фильтрации активных ролей)
            queryInterface.addIndex('roles', ['is_active'], {
                name: 'idx_roles_is_active',
            }),

            // Индекс 5: role (unique, для быстрого поиска по названию)
            queryInterface.addIndex('roles', ['role'], {
                name: 'idx_roles_role',
                unique: true,
            }),
        ]);
    },

    async down(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        // ===== ROLLBACK: УДАЛЕНИЕ ТАБЛИЦЫ roles =====
        // dropTable автоматически удаляет все индексы, FK и constraints
        await queryInterface.dropTable('roles');

        // ===== ROLLBACK: ВОССТАНОВЛЕНИЕ СТАРЫХ ТАБЛИЦ =====
        // Восстанавливаем role
        await queryInterface.createTable('role', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            role: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });

        // Восстанавливаем индексы для role
        await Promise.all([
            queryInterface.addIndex('role', ['role'], {
                name: 'idx_role_role',
                unique: true,
            }),
            queryInterface.addIndex('role', ['description'], {
                name: 'idx_role_description',
            }),
            queryInterface.addIndex('role', ['role', 'description'], {
                name: 'idx_role_role_description',
            }),
        ]);

        // Восстанавливаем user_role
        await queryInterface.createTable('user_role', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            role_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'role',
                    key: 'id',
                },
                allowNull: false,
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: false,
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
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

        // Восстанавливаем индексы для user_role
        await Promise.all([
            queryInterface.addIndex('user_role', ['user_id'], {
                name: 'idx_user_role_user_id',
            }),
            queryInterface.addIndex('user_role', ['role_id'], {
                name: 'idx_user_role_role_id',
            }),
            queryInterface.addIndex('user_role', ['user_id', 'role_id'], {
                name: 'idx_user_role_unique',
                unique: true,
            }),
        ]);
    },
};

export default migration;
