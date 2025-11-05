import type { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;

    down(queryInterface: QueryInterface): Promise<void>;
}

/**
 * Миграция: Добавление tenant_id в таблицу user для multi-tenant support
 *
 * Цель: Обеспечить tenant isolation для пользователей
 * - Добавляет колонку tenant_id с FK на tenants.id
 * - Backfill: устанавливает tenant_id = 1 (default tenant) для существующих пользователей
 * - Создаёт составные индексы для оптимизации tenant-scoped запросов
 */
const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        // 1. Добавляем колонку tenant_id (nullable для backfill)
        await queryInterface.addColumn('user', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: true, // Временно nullable для backfill
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Tenant ID (FK → tenants.id) for multi-tenant isolation',
        });

        console.log('✓ Added tenant_id column to user table');

        // 2. Backfill: устанавливаем tenant_id = 1 (default tenant) для существующих пользователей
        await queryInterface.sequelize.query(`
            UPDATE "user"
            SET tenant_id = 1
            WHERE tenant_id IS NULL;
        `);

        console.log('✓ Backfilled tenant_id = 1 for existing users');

        // 3. Делаем колонку NOT NULL после backfill
        await queryInterface.changeColumn('user', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: false, // Теперь NOT NULL
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        console.log('✓ Changed tenant_id to NOT NULL');

        // 4. Создаём индексы для оптимизации tenant-scoped запросов
        const indexes = [
            // Базовый индекс по tenant_id
            {
                table: 'user',
                columns: ['tenant_id'],
                name: 'idx_user_tenant_id',
            },
            // Составной индекс: tenant_id + id (для быстрого поиска по PK в рамках tenant)
            {
                table: 'user',
                columns: ['tenant_id', 'id'],
                name: 'idx_user_tenant_id_id',
            },
            // Составной индекс: tenant_id + email (для логина и проверки уникальности в рамках tenant)
            {
                table: 'user',
                columns: ['tenant_id', 'email'],
                name: 'idx_user_tenant_id_email',
            },
            // Составной индекс: tenant_id + is_active (для фильтрации активных пользователей tenant)
            {
                table: 'user',
                columns: ['tenant_id', 'is_active'],
                name: 'idx_user_tenant_id_is_active',
            },
        ];

        for (const index of indexes) {
            try {
                await queryInterface.addIndex(index.table, index.columns, {
                    name: index.name,
                });
                console.log(
                    `✓ Created index ${index.name} on ${index.table}(${index.columns.join(',')})`,
                );
            } catch {
                console.log(
                    `⚠ Index ${index.name} already exists on ${index.table} - skipping`,
                );
            }
        }

        console.log('✓ Migration completed: tenant_id added to user table');
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем индексы
        const indexes = [
            'idx_user_tenant_id',
            'idx_user_tenant_id_id',
            'idx_user_tenant_id_email',
            'idx_user_tenant_id_is_active',
        ];

        for (const indexName of indexes) {
            try {
                await queryInterface.removeIndex('user', indexName);
                console.log(`✓ Removed index ${indexName}`);
            } catch {
                console.log(`⚠ Index ${indexName} not found - skipping`);
            }
        }

        // Удаляем колонку tenant_id (FK будет удалён автоматически)
        await queryInterface.removeColumn('user', 'tenant_id');

        console.log('✓ Rollback completed: tenant_id removed from user table');
    },
};

export default migration;
