import { getConfig } from '../index';

/**
 * Конфигурация для External Role Sync сервисов
 * Использует переменные окружения через getConfig()
 */
export function getSyncConfig() {
    const config = getConfig();

    return {
        timezone: config.SYNC_TIMEZONE,
        retry: {
            maxRetries: config.SYNC_MAX_RETRIES,
            initialDelayMs: config.SYNC_INITIAL_DELAY_MS,
            maxDelayMs: config.SYNC_MAX_DELAY_MS,
            backoffMultiplier: config.SYNC_BACKOFF_MULTIPLIER,
        },
        concurrency: {
            limit: config.SYNC_CONCURRENCY_LIMIT,
        },
        rateLimit: {
            points: config.SYNC_RATE_LIMIT_POINTS,
            duration: config.SYNC_RATE_LIMIT_DURATION,
        },
    };
}
