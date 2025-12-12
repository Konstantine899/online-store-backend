import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Jest global setup - загружает .test.env перед запуском тестов
 *
 * Этот файл выполняется перед всеми тестами и обеспечивает
 * наличие необходимых environment переменных для unit-тестов.
 */

// Загружаем .test.env из корня проекта
const envPath = path.resolve(__dirname, '../.test.env');

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(
        `⚠️  Не удалось загрузить .test.env из ${envPath}. ` +
            `Unit-тесты могут упасть из-за отсутствия env переменных.`,
    );
    console.warn(`Ошибка: ${result.error.message}`);
} else {
    console.log(`✅ Environment loaded from ${envPath}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   DEBUG_SQL: ${process.env.DEBUG_SQL ?? 'false'}`);
}

/**
 * Подавление SQL логов в тестах (если DEBUG_SQL не включен)
 *
 * Sequelize может логировать через console.log даже при logging:false.
 * Перехватываем и фильтруем SQL-подобные логи для чистого вывода.
 */
if (process.env.DEBUG_SQL !== 'true') {
    const originalConsoleLog = console.log;
    const originalConsoleDebug = console.debug;

    // Паттерны для определения SQL логов
    const sqlPatterns = [
        /Executing \(default\):/i,
        /SELECT.*FROM/i,
        /INSERT INTO/i,
        /UPDATE.*SET/i,
        /DELETE FROM/i,
        /CREATE TABLE/i,
        /ALTER TABLE/i,
        /DROP TABLE/i,
    ];

    const isSqlLog = (message: string): boolean => {
        return sqlPatterns.some((pattern) => pattern.test(message));
    };

    // Перехватываем console.log
    console.log = (...args: Parameters<typeof originalConsoleLog>): void => {
        const message = args.join(' ');
        if (!isSqlLog(message)) {
            originalConsoleLog(...args);
        }
        // SQL логи просто игнорируем
    };

    // Перехватываем console.debug (некоторые библиотеки используют debug)
    console.debug = (
        ...args: Parameters<typeof originalConsoleDebug>
    ): void => {
        const message = args.join(' ');
        if (!isSqlLog(message)) {
            originalConsoleDebug(...args);
        }
        // SQL логи просто игнорируем
    };

    console.log('🔇 SQL logging suppressed (set DEBUG_SQL=true to enable)');
}
