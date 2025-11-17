/**
 * Скрипт для EXPLAIN анализа критичных пользовательских запросов
 * Проверяет использование индексов и эффективность запросов
 *
 * Запуск: npx ts-node scripts/explain-user-queries.ts
 */

import * as dotenv from 'dotenv';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

// Загружаем переменные окружения
dotenv.config();

interface ExplainResult {
    id: number;
    select_type: string;
    table: string;
    type: string;
    possible_keys: string | null;
    key: string | null;
    key_len: number | null;
    ref: string | null;
    rows: number;
    Extra: string | null;
}

/**
 * Анализирует использование индексов для запроса
 */
function analyzeExplain(queryName: string, result: ExplainResult[]): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 EXPLAIN: ${queryName}`);
    console.log(`${'='.repeat(80)}\n`);

    result.forEach((row) => {
        console.log(`Таблица: ${row.table}`);
        console.log(`  Тип доступа: ${row.type}`);
        console.log(
            `  Используемый индекс: ${row.key ?? '⚠️  НЕТ (FULL TABLE SCAN)'}`,
        );
        console.log(`  Возможные индексы: ${row.possible_keys ?? 'нет'}`);
        console.log(`  Примерное количество строк: ${row.rows}`);
        console.log(`  Дополнительно: ${row.Extra ?? '-'}`);

        // Предупреждения
        if (row.type === 'ALL') {
            console.log('  🔴 ПРЕДУПРЕЖДЕНИЕ: Full table scan (нет индекса)!');
        } else if (row.type === 'index') {
            console.log('  🟡 ВНИМАНИЕ: Index scan (можно оптимизировать)');
        } else if (row.type === 'ref' || row.type === 'const') {
            console.log('  ✅ Хорошо: Используется индекс');
        }
    });
}

async function runExplainAnalysis(): Promise<void> {
    const sequelize = new Sequelize({
        dialect: 'mysql',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? 'online_store',
        logging: false,
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Подключение к БД установлено');

        const tenantId = 1; // Тестовый tenant
        const searchTerm = 'Иван%';

        // ════════════════════════════════════════════════════════════════
        // QUERY 1: getUserStatistics (после tenant_id fix)
        // ════════════════════════════════════════════════════════════════
        const query1 = `
            EXPLAIN
            SELECT
                COUNT(*) as total,
                SUM(is_active = 1) as active,
                SUM(is_blocked = 1) as blocked,
                SUM(is_verified = 1) as verified
            FROM user
            WHERE is_deleted = 0 AND tenant_id = ${tenantId}
        `;
        const result1 = await sequelize.query<ExplainResult>(query1, {
            type: QueryTypes.SELECT,
        });
        analyzeExplain('getUserStatistics (tenant_id fix)', result1);

        // ════════════════════════════════════════════════════════════════
        // QUERY 2: findListUsersPaginated (после tenant_id fix)
        // ════════════════════════════════════════════════════════════════
        const query2 = `
            EXPLAIN
            SELECT * FROM user
            WHERE tenant_id = ${tenantId}
            ORDER BY created_at DESC
            LIMIT 10 OFFSET 0
        `;
        const result2 = await sequelize.query<ExplainResult>(query2, {
            type: QueryTypes.SELECT,
        });
        analyzeExplain('findListUsersPaginated (tenant_id fix)', result2);

        // ════════════════════════════════════════════════════════════════
        // QUERY 3: findUsersWithFiltersPaginated (комбинация фильтров)
        // ════════════════════════════════════════════════════════════════
        const query3 = `
            EXPLAIN
            SELECT * FROM user
            WHERE tenant_id = ${tenantId}
              AND is_deleted = 0
              AND is_active = 1
              AND is_blocked = 0
            ORDER BY created_at DESC
            LIMIT 10 OFFSET 0
        `;
        const result3 = await sequelize.query<ExplainResult>(query3, {
            type: QueryTypes.SELECT,
        });
        analyzeExplain('findUsersWithFiltersPaginated (active users)', result3);

        // ════════════════════════════════════════════════════════════════
        // QUERY 4: searchUsersByName (LIKE запросы)
        // ════════════════════════════════════════════════════════════════
        const query4 = `
            EXPLAIN
            SELECT * FROM user
            WHERE tenant_id = ${tenantId}
              AND is_deleted = 0
              AND (first_name LIKE '${searchTerm}' OR last_name LIKE '${searchTerm}')
            ORDER BY created_at DESC
            LIMIT 10 OFFSET 0
        `;
        const result4 = await sequelize.query<ExplainResult>(query4, {
            type: QueryTypes.SELECT,
        });
        analyzeExplain('searchUsersByName (LIKE queries)', result4);

        // ════════════════════════════════════════════════════════════════
        // QUERY 5: bulkBlockUsers (bulk UPDATE)
        // ════════════════════════════════════════════════════════════════
        const query5 = `
            EXPLAIN
            UPDATE user
            SET is_blocked = 1
            WHERE id IN (1, 2, 3, 4, 5)
              AND tenant_id = ${tenantId}
              AND is_deleted = 0
        `;
        const result5 = await sequelize.query<ExplainResult>(query5, {
            type: QueryTypes.SELECT,
        });
        analyzeExplain('bulkBlockUsers (bulk UPDATE)', result5);

        console.log(`\n${'='.repeat(80)}`);
        console.log('📋 ИТОГОВЫЕ РЕКОМЕНДАЦИИ');
        console.log(`${'='.repeat(80)}\n`);

        console.log('✅ Проверено: 5 критичных запросов');
        console.log('✅ Рекомендуется: type = "ref" или "const"');
        console.log('❌ Избегать: type = "ALL" (full table scan)');
        console.log(
            '\n💡 Для оптимизации запросов с LIKE используйте полнотекстовый поиск (FULLTEXT index)',
        );
        console.log(
            '💡 Для bulk операций убедитесь, что используется idx_user_tenant_id_id',
        );
    } catch (error) {
        console.error('❌ Ошибка при выполнении EXPLAIN:', error);
    } finally {
        await sequelize.close();
        console.log('\n✅ Подключение к БД закрыто');
    }
}

// Запуск анализа
runExplainAnalysis()
    .then(() => {
        console.log('\n✅ EXPLAIN анализ завершён');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Ошибка:', error);
        process.exit(1);
    });
