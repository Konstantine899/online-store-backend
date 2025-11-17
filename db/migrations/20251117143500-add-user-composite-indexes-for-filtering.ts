import type { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;

    down(queryInterface: QueryInterface): Promise<void>;
}

/**
 * Миграция: Добавление составных индексов для оптимизации запросов пользователей
 *
 * Цель: Оптимизация фильтрации и поиска пользователей по tenant + флагам статуса
 * Контекст: USER-001-11 - Полная оптимизация User Module (Этап 2)
 *
 * Индексы:
 * - 8 составных индексов (tenant_id + флаги/имена)
 * - Оптимизация запросов: active/blocked/verified/deleted пользователей
 * - Оптимизация поиска по именам и телефону
 * - Защита от N+1 и полных сканов таблицы
 */
const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        const indexes = [
            // 1. Индекс для фильтрации активных пользователей по tenant
            {
                columns: ['tenant_id', 'is_active'],
                name: 'idx_user_tenant_id_is_active',
                comment:
                    'Оптимизация запросов активных пользователей (tenant-scoped)',
            },

            // 2. Индекс для фильтрации заблокированных пользователей по tenant
            {
                columns: ['tenant_id', 'is_blocked'],
                name: 'idx_user_tenant_id_is_blocked',
                comment:
                    'Оптимизация запросов заблокированных пользователей (tenant-scoped)',
            },

            // 3. Индекс для фильтрации верифицированных пользователей по tenant
            {
                columns: ['tenant_id', 'is_verified'],
                name: 'idx_user_tenant_id_is_verified',
                comment:
                    'Оптимизация запросов верифицированных пользователей (tenant-scoped)',
            },

            // 4. Составной индекс для оптимизации комбинированных фильтров (удалённые/активные/заблокированные)
            {
                columns: [
                    'tenant_id',
                    'is_deleted',
                    'is_active',
                    'is_blocked',
                ],
                name: 'idx_user_tenant_id_is_deleted_is_active',
                comment:
                    'Оптимизация запросов с множественными статусами (tenant-scoped)',
            },

            // 5. Индекс для поиска по имени по tenant
            {
                columns: ['tenant_id', 'first_name'],
                name: 'idx_user_tenant_id_first_name',
                comment:
                    'Оптимизация поиска по имени (tenant-scoped)',
            },

            // 6. Индекс для поиска по фамилии по tenant
            {
                columns: ['tenant_id', 'last_name'],
                name: 'idx_user_tenant_id_last_name',
                comment:
                    'Оптимизация поиска по фамилии (tenant-scoped)',
            },

            // 7. Индекс для поиска по телефону по tenant
            {
                columns: ['tenant_id', 'phone'],
                name: 'idx_user_tenant_id_phone',
                comment:
                    'Оптимизация поиска по телефону (tenant-scoped)',
            },

            // 8. Составной индекс для поиска по полному имени (first_name + last_name) по tenant
            {
                columns: ['tenant_id', 'first_name', 'last_name'],
                name: 'idx_user_tenant_id_full_name',
                comment:
                    'Оптимизация поиска по полному имени (tenant-scoped)',
            },
        ];

        console.log('📊 Создание составных индексов для user таблицы...');

        // Создаём индексы последовательно (не параллельно) для стабильности
        for (const index of indexes) {
            try {
                await queryInterface.addIndex('user', index.columns, {
                    name: index.name,
                });
                console.log(
                    `✓ Создан индекс ${index.name} на user(${index.columns.join(',')})`,
                );
            } catch (error: unknown) {
                // Если индекс уже существует - пропускаем
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                if (
                    errorMessage.includes('Duplicate key name') ||
                    errorMessage.includes('already exists')
                ) {
                    console.log(
                        `⚠ Индекс ${index.name} уже существует - пропускаем`,
                    );
                } else {
                    console.error(
                        `❌ Ошибка создания индекса ${index.name}: ${errorMessage}`,
                    );
                    throw error;
                }
            }
        }

        console.log(
            '✅ Успешно создано 8 составных индексов для оптимизации запросов пользователей',
        );
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        const indexes = [
            'idx_user_tenant_id_is_active',
            'idx_user_tenant_id_is_blocked',
            'idx_user_tenant_id_is_verified',
            'idx_user_tenant_id_is_deleted_is_active',
            'idx_user_tenant_id_first_name',
            'idx_user_tenant_id_last_name',
            'idx_user_tenant_id_phone',
            'idx_user_tenant_id_full_name',
        ];

        console.log('📊 Удаление составных индексов из user таблицы...');

        for (const indexName of indexes) {
            try {
                await queryInterface.removeIndex('user', indexName);
                console.log(`✓ Удалён индекс ${indexName}`);
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                console.log(
                    `⚠ Индекс ${indexName} не найден - пропускаем (${errorMessage})`,
                );
            }
        }

        console.log(
            '✅ Успешно удалены составные индексы для user таблицы',
        );
    },
};

export default migration;

