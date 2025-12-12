import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { validateEnv } from '../env/validation';

/**
 * Токен для инъекции Redis клиента
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Провайдер для создания и конфигурации Redis клиента
 * Клиент создаётся только если REDIS_ENABLED=true
 * В dev/test окружениях Redis опционален
 */
export const redisProvider = {
    provide: REDIS_CLIENT,
    useFactory: (): Redis | null => {
        const logger = new Logger('RedisProvider');
        const env = validateEnv(process.env);

        // Если Redis отключен - возвращаем null (кэширование не используется)
        if (!env.REDIS_ENABLED) {
            logger.log('Redis кэширование отключено (REDIS_ENABLED=false)');
            return null;
        }

        try {
            const redis = new Redis({
                host: env.REDIS_HOST,
                port: env.REDIS_PORT,
                password: env.REDIS_PASSWORD ?? undefined, // undefined если пароля нет
                db: env.REDIS_DB,
                keyPrefix: env.REDIS_KEY_PREFIX,
                retryStrategy: (times: number): number | null => {
                    // Экспоненциальная задержка с максимумом 3 секунды
                    const delay = Math.min(times * 50, 3000);

                    // После 10 попыток - прекратить реконнект
                    if (times > 10) {
                        logger.error(
                            'Redis: превышен лимит попыток переподключения (10)',
                        );
                        return null;
                    }

                    logger.warn(
                        `Redis: попытка переподключения #${times} через ${delay}ms`,
                    );
                    return delay;
                },
                lazyConnect: false, // Подключаться сразу при создании
                enableReadyCheck: true, // Проверять готовность перед использованием
                maxRetriesPerRequest: 3, // Макс. количество попыток для одного запроса
            });

            redis.on('connect', (): void => {
                logger.log(
                    `Redis подключен: ${env.REDIS_HOST}:${env.REDIS_PORT} (db: ${env.REDIS_DB})`,
                );
            });

            redis.on('ready', (): void => {
                logger.log('Redis готов к использованию');
            });

            redis.on('error', (error: Error): void => {
                logger.error(`Redis ошибка: ${error.message}`);
            });

            redis.on('close', (): void => {
                logger.warn('Redis соединение закрыто');
            });

            redis.on('reconnecting', (): void => {
                logger.log('Redis: переподключение...');
            });

            return redis;
        } catch (error: unknown) {
            logger.error(
                `Не удалось создать Redis клиент: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            // В dev/test окружениях - продолжаем без кэша
            // В production - приложение должно упасть (пусть оркестратор перезапустит)
            if (env.NODE_ENV === 'production') {
                throw error;
            }
            return null;
        }
    },
};
