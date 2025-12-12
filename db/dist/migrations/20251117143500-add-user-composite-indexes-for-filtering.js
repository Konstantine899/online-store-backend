"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        const indexes = [
            {
                columns: ['tenant_id', 'is_active'],
                name: 'idx_user_tenant_id_is_active',
                comment: 'Оптимизация запросов активных пользователей (tenant-scoped)',
            },
            {
                columns: ['tenant_id', 'is_blocked'],
                name: 'idx_user_tenant_id_is_blocked',
                comment: 'Оптимизация запросов заблокированных пользователей (tenant-scoped)',
            },
            {
                columns: ['tenant_id', 'is_verified'],
                name: 'idx_user_tenant_id_is_verified',
                comment: 'Оптимизация запросов верифицированных пользователей (tenant-scoped)',
            },
            {
                columns: [
                    'tenant_id',
                    'is_deleted',
                    'is_active',
                    'is_blocked',
                ],
                name: 'idx_user_tenant_id_is_deleted_is_active',
                comment: 'Оптимизация запросов с множественными статусами (tenant-scoped)',
            },
            {
                columns: ['tenant_id', 'first_name'],
                name: 'idx_user_tenant_id_first_name',
                comment: 'Оптимизация поиска по имени (tenant-scoped)',
            },
            {
                columns: ['tenant_id', 'last_name'],
                name: 'idx_user_tenant_id_last_name',
                comment: 'Оптимизация поиска по фамилии (tenant-scoped)',
            },
            {
                columns: ['tenant_id', 'phone'],
                name: 'idx_user_tenant_id_phone',
                comment: 'Оптимизация поиска по телефону (tenant-scoped)',
            },
            {
                columns: ['tenant_id', 'first_name', 'last_name'],
                name: 'idx_user_tenant_id_full_name',
                comment: 'Оптимизация поиска по полному имени (tenant-scoped)',
            },
        ];
        console.log('📊 Создание составных индексов для user таблицы...');
        for (const index of indexes) {
            try {
                await queryInterface.addIndex('user', index.columns, {
                    name: index.name,
                });
                console.log(`✓ Создан индекс ${index.name} на user(${index.columns.join(',')})`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (errorMessage.includes('Duplicate key name') ||
                    errorMessage.includes('already exists')) {
                    console.log(`⚠ Индекс ${index.name} уже существует - пропускаем`);
                }
                else {
                    console.error(`❌ Ошибка создания индекса ${index.name}: ${errorMessage}`);
                    throw error;
                }
            }
        }
        console.log('✅ Успешно создано 8 составных индексов для оптимизации запросов пользователей');
    },
    async down(queryInterface) {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.log(`⚠ Индекс ${indexName} не найден - пропускаем (${errorMessage})`);
            }
        }
        console.log('✅ Успешно удалены составные индексы для user таблицы');
    },
};
exports.default = migration;
