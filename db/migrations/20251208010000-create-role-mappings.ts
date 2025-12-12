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
        // ===== СОЗДАНИЕ ТАБЛИЦЫ role_mappings =====
        await queryInterface.createTable('role_mappings', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: 'Уникальный идентификатор маппинга',
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
            external_role_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Название роли/группы во внешней системе',
            },
            external_role_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'ID роли во внешней системе (если доступен)',
            },
            internal_role_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'ID роли в нашей системе',
            },
            mapping_rules: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Дополнительные правила маппинга (условия, фильтры)',
            },
            priority: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 100,
                comment: 'Приоритет применения (меньше = выше приоритет)',
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Активен ли маппинг',
            },
            is_default: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment:
                    'Использовать как default роль, если нет других совпадений',
            },
            mapped_users_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Количество пользователей с этим маппингом',
            },
            last_applied_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Время последнего применения маппинга',
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
            queryInterface.addConstraint('role_mappings', {
                fields: ['external_role_config_id'],
                type: 'foreign key',
                name: 'fk_role_mappings_external_role_config_id',
                references: {
                    table: 'external_role_configs',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            }),
            queryInterface.addConstraint('role_mappings', {
                fields: ['tenant_id'],
                type: 'foreign key',
                name: 'fk_role_mappings_tenant_id',
                references: {
                    table: 'tenants',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            }),
            queryInterface.addConstraint('role_mappings', {
                fields: ['internal_role_id'],
                type: 'foreign key',
                name: 'fk_role_mappings_internal_role_id',
                references: {
                    table: 'roles',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            }),
        ]);

        // ===== СОЗДАНИЕ ИНДЕКСОВ =====
        await Promise.all([
            queryInterface.addIndex(
                'role_mappings',
                ['external_role_config_id'],
                {
                    name: 'idx_role_mappings_config_id',
                },
            ),
            queryInterface.addIndex('role_mappings', ['tenant_id'], {
                name: 'idx_role_mappings_tenant_id',
            }),
            queryInterface.addIndex('role_mappings', ['internal_role_id'], {
                name: 'idx_role_mappings_internal_role_id',
            }),
            queryInterface.addIndex('role_mappings', ['external_role_name'], {
                name: 'idx_role_mappings_external_role_name',
            }),
            queryInterface.addIndex('role_mappings', ['priority'], {
                name: 'idx_role_mappings_priority',
            }),
            queryInterface.addIndex('role_mappings', ['is_active'], {
                name: 'idx_role_mappings_active',
            }),
            queryInterface.addIndex(
                'role_mappings',
                ['external_role_config_id', 'external_role_name'],
                {
                    name: 'uk_role_mappings_config_external',
                    unique: true,
                },
            ),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // ===== ROLLBACK: УДАЛЕНИЕ ТАБЛИЦЫ =====
        await queryInterface.dropTable('role_mappings');
    },
};

export default migration;
