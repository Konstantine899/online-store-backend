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
        // ===== ШАГ 1: СОЗДАНИЕ ТАБЛИЦЫ role_auto_renewal_config =====
        await queryInterface.createTable('role_auto_renewal_config', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment:
                    'Уникальный идентификатор конфигурации автоматического продления роли',
            },
            user_role_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: 'user_roles',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment:
                    'ID назначения роли (FK → user_roles.id), UNIQUE - одна конфигурация на роль',
            },
            is_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment:
                    'Включено ли автоматическое продление (true - включено, false - выключено)',
            },
            renewal_duration_ms: {
                type: Sequelize.BIGINT,
                allowNull: false,
                comment:
                    'Длительность продления роли в миллисекундах (например, 2592000000 = 30 дней)',
            },
            max_renewals: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 12,
                comment:
                    'Максимальное количество автоматических продлений (0 = без ограничений)',
            },
            current_renewal_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment:
                    'Текущее количество выполненных продлений (инкрементируется при каждом продлении)',
            },
            last_renewed_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
                comment:
                    'Дата и время последнего автоматического продления (NULL если еще не продлевалась)',
            },
            notification_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment:
                    'Включены ли уведомления об истечении для этой роли (true - включены, false - выключены)',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'Дата и время создания конфигурации',
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'Дата и время последнего обновления конфигурации',
            },
        });

        // ===== ШАГ 2: СОЗДАНИЕ ИНДЕКСОВ =====
        // Примечание: UNIQUE constraint на user_role_id уже создан через unique: true в поле
        // MySQL автоматически создает индекс для UNIQUE constraint, поэтому отдельный индекс не нужен
        await Promise.all([
            // Индекс 1: is_enabled (для поиска активных конфигураций продления)
            queryInterface.addIndex('role_auto_renewal_config', ['is_enabled'], {
                name: 'idx_role_auto_renewal_config_is_enabled',
            }),

            // Индекс 2: Составной индекс (user_role_id, is_enabled) для оптимизации запросов
            // user_role_id уже имеет индекс от UNIQUE constraint, но составной индекс может помочь в JOIN
            queryInterface.addIndex(
                'role_auto_renewal_config',
                ['user_role_id', 'is_enabled'],
                {
                    name: 'idx_role_auto_renewal_config_user_role_enabled',
                },
            ),
        ]);

        // ===== ШАГ 3: ДОБАВЛЕНИЕ CHECK CONSTRAINTS =====
        // Проверка что current_renewal_count не превышает max_renewals (если max_renewals > 0)
        // Проверка что renewal_duration_ms > 0
        // Проверка что max_renewals >= 0

        // MySQL поддерживает CHECK constraints с версии 8.0.16
        // Для совместимости проверки будут на уровне приложения
        // Но можно добавить триггеры или оставить валидацию в модели
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // ===== ROLLBACK: УДАЛЕНИЕ ТАБЛИЦЫ role_auto_renewal_config =====
        // dropTable автоматически удаляет все индексы и constraints
        await queryInterface.dropTable('role_auto_renewal_config');
    },
};

export default migration;

