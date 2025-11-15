import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/infrastructure/config/redis/redis.provider';
import { validateEnv } from '@app/infrastructure/config/env/validation';

/**
 * Сервис для работы с Redis кэшем
 * Предоставляет методы для get/set/del с автоматическим TTL
 * Если Redis отключен или недоступен - работает как pass-through (без кэширования)
 */
@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly defaultTTL: number;
    private readonly isEnabled: boolean;

    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis | null,
    ) {
        const env = validateEnv(process.env);
        this.defaultTTL = env.REDIS_TTL;
        this.isEnabled = env.REDIS_ENABLED && this.redisClient !== null;

        if (!this.isEnabled) {
            this.logger.log(
                'CacheService работает без Redis (pass-through mode)',
            );
        }
    }

    /**
     * Получить значение из кэша
     * @returns null если ключа нет или кэш отключен
     */
    async get<T = unknown>(key: string): Promise<T | null> {
        if (!this.isEnabled || !this.redisClient) {
            return null;
        }

        try {
            const value = await this.redisClient.get(key);
            if (!value) {
                return null;
            }

            return JSON.parse(value) as T;
        } catch (error: unknown) {
            this.logger.error(
                `Ошибка чтения из кэша (${key}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return null; // При ошибке - возвращаем null (читаем из БД)
        }
    }

    /**
     * Установить значение в кэш с TTL
     * @param ttl TTL в секундах (если не указан - используется defaultTTL из env)
     */
    async set<T = unknown>(
        key: string,
        value: T,
        ttl?: number,
    ): Promise<void> {
        if (!this.isEnabled || !this.redisClient) {
            return; // Если кэш отключен - ничего не делаем
        }

        try {
            const serialized = JSON.stringify(value);
            const ttlSeconds = ttl ?? this.defaultTTL;
            await this.redisClient.setex(key, ttlSeconds, serialized);
        } catch (error: unknown) {
            this.logger.error(
                `Ошибка записи в кэш (${key}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            // При ошибке - просто логируем, не прерываем основной поток
        }
    }

    /**
     * Удалить ключ из кэша
     * @returns количество удалённых ключей
     */
    async del(key: string): Promise<number> {
        if (!this.isEnabled || !this.redisClient) {
            return 0;
        }

        try {
            return await this.redisClient.del(key);
        } catch (error: unknown) {
            this.logger.error(
                `Ошибка удаления из кэша (${key}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return 0;
        }
    }

    /**
     * Удалить все ключи по паттерну (например, 'user:*')
     * ⚠️ ВНИМАНИЕ: Используйте с осторожностью, может быть медленным на больших БД
     * @returns количество удалённых ключей
     */
    async delPattern(pattern: string): Promise<number> {
        if (!this.isEnabled || !this.redisClient) {
            return 0;
        }

        try {
            // Используем SCAN для безопасного итерирования (не блокирует Redis)
            let cursor = '0';
            let deletedCount = 0;

            do {
                const [nextCursor, keys] = await this.redisClient.scan(
                    cursor,
                    'MATCH',
                    pattern,
                    'COUNT',
                    100, // Количество ключей за итерацию
                );
                cursor = nextCursor;

                if (keys.length > 0) {
                    const deleted = await this.redisClient.del(...keys);
                    deletedCount += deleted;
                }
            } while (cursor !== '0');

            if (deletedCount > 0) {
                this.logger.log(
                    `Удалено ${deletedCount} ключей по паттерну: ${pattern}`,
                );
            }

            return deletedCount;
        } catch (error: unknown) {
            this.logger.error(
                `Ошибка удаления по паттерну (${pattern}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return 0;
        }
    }

    /**
     * Проверить существование ключа в кэше
     */
    async exists(key: string): Promise<boolean> {
        if (!this.isEnabled || !this.redisClient) {
            return false;
        }

        try {
            const result = await this.redisClient.exists(key);
            return result === 1;
        } catch (error: unknown) {
            this.logger.error(
                `Ошибка проверки существования ключа (${key}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return false;
        }
    }

    /**
     * Получить TTL ключа (в секундах)
     * @returns TTL в секундах, -1 если ключ без TTL, -2 если ключа нет
     */
    async ttl(key: string): Promise<number> {
        if (!this.isEnabled || !this.redisClient) {
            return -2;
        }

        try {
            return await this.redisClient.ttl(key);
        } catch (error: unknown) {
            this.logger.error(
                `Ошибка получения TTL (${key}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return -2;
        }
    }

    /**
     * Проверить доступность Redis
     */
    async ping(): Promise<boolean> {
        if (!this.isEnabled || !this.redisClient) {
            return false;
        }

        try {
            const result = await this.redisClient.ping();
            return result === 'PONG';
        } catch (error: unknown) {
            this.logger.error(
                `Redis ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return false;
        }
    }
}

