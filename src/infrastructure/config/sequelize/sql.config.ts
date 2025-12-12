import { dbToken } from '@app/infrastructure/config/sequelize/db-token';
import { registerAs } from '@nestjs/config';
import type { Dialect, PoolOptions } from 'sequelize';

/**
 * Получение конфигурации connection pool в зависимости от окружения
 *
 * Стратегия:
 * - CI (parallel): 30 max для 4 workers
 * - Test (sequential): 10 max для стабильности
 * - Production: 20 max для оптимальной производительности
 */
const getPoolConfig = (): PoolOptions => {
    const isCI = process.env.CI === 'true';
    const isTestEnv = process.env.NODE_ENV === 'test';

    // Приоритет: ENV переменные (CI override) > defaults
    const envMax = parseInt(process.env.SEQUELIZE_POOL_MAX ?? '0', 10);
    const envMin = parseInt(process.env.SEQUELIZE_POOL_MIN ?? '0', 10);

    if (envMax > 0) {
        // CI окружение с кастомной конфигурацией
        return {
            max: envMax,
            min: envMin > 0 ? envMin : Math.floor(envMax / 3),
            acquire: 60000,
            idle: 10000,
        };
    }

    // Default конфигурация по окружению
    if (isTestEnv) {
        // Test: умеренный pool
        // Sequential (локально): 10 достаточно
        // Parallel (CI): будет override через SEQUELIZE_POOL_MAX
        return {
            max: isCI ? 30 : 10,
            min: isCI ? 10 : 2,
            acquire: 30000,
            idle: 10000,
        };
    }

    // Production/Development
    return {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000,
    };
};

export const sqlConfig = registerAs(dbToken, () => {
    // В тестах можно явно включить SQL логирование через DEBUG_SQL=true
    const isTestEnv = process.env.NODE_ENV === 'test';
    const debugSql = process.env.DEBUG_SQL === 'true';
    const sqlLogging = process.env.SQL_LOGGING === 'true';

    // В тестах: логируем только если DEBUG_SQL=true, иначе всегда false
    // В других окружениях: используем SQL_LOGGING
    const shouldLog = isTestEnv ? debugSql : sqlLogging;

    return {
        dialect: <Dialect>process.env.DIALECT || 'mysql',
        logging: shouldLog ? console.log : false,
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT),
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        pool: getPoolConfig(), // ← Адаптивный connection pool
        autoLoadModels: true,
        synchronize: false, // отключаю автосинхронизацию
    };
});
