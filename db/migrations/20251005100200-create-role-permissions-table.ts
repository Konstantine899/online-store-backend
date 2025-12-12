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
        // ===== ШАГ 1: СОЗДАНИЕ ТАБЛИЦЫ role_permissions =====
        await queryInterface.createTable('role_permissions', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Уникальный идентификатор разрешения',
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
            resource: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment:
                    'Название ресурса (например: "users", "products", "orders", "catalog")',
            },
            action: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment:
                    'Действие над ресурсом (например: "create", "read", "update", "delete", "list", "manage")',
            },
            conditions: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
                comment:
                    'Условия применения разрешения в формате JSON (например: {"status": "active", "tenant_id": 1})',
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
        // Одна роль не может иметь дублирующиеся разрешения (resource + action)
        await queryInterface.addConstraint('role_permissions', {
            fields: ['role_id', 'resource', 'action'],
            type: 'unique',
            name: 'uq_role_permissions_role_resource_action',
        });

        // ===== ШАГ 3: СОЗДАНИЕ ИНДЕКСОВ =====
        await Promise.all([
            // Индекс 1: role_id (для поиска всех разрешений роли)
            queryInterface.addIndex('role_permissions', ['role_id'], {
                name: 'idx_role_permissions_role_id',
            }),

            // Индекс 2: resource (для поиска всех разрешений по ресурсу)
            queryInterface.addIndex('role_permissions', ['resource'], {
                name: 'idx_role_permissions_resource',
            }),

            // Индекс 3: action (для поиска всех разрешений по действию)
            queryInterface.addIndex('role_permissions', ['action'], {
                name: 'idx_role_permissions_action',
            }),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // ===== ROLLBACK: УДАЛЕНИЕ ТАБЛИЦЫ role_permissions =====
        // dropTable автоматически удаляет все индексы и constraints
        await queryInterface.dropTable('role_permissions');
    },
};

export default migration;
