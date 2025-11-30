import { Injectable, Inject, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT, DEFAULT_CACHE_TTL } from './redis.constants';

/**
 * Redis сервис
 * Обёртка над Redis client с дополнительной функциональностью
 */
@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

    /**
     * Проверить подключение к Redis
     */
    async ping(): Promise<boolean> {
        try {
            const result = await this.redisClient.ping();
            this.logger.log(`Redis PING: ${result}`);
            return result === 'PONG';
        } catch (error) {
            this.logger.error('Redis ping failed', error);
            return false;
        }
    }

    /**
     * Получить значение по ключу
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redisClient.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            this.logger.error(`Redis GET error for key: ${key}`, error);
            return null;
        }
    }

    /**
     * Установить значение с TTL
     * @param key - ключ
     * @param value - значение
     * @param ttl - время жизни в секундах (по умолчанию 15 минут)
     */
    async set<T>(
        key: string,
        value: T,
        ttl: number = DEFAULT_CACHE_TTL,
    ): Promise<boolean> {
        try {
            const serialized = JSON.stringify(value);
            await this.redisClient.setex(key, ttl, serialized);
            this.logger.debug(`Redis SET: ${key} (TTL: ${ttl}s)`);
            return true;
        } catch (error) {
            this.logger.error(`Redis SET error for key: ${key}`, error);
            return false;
        }
    }

    /**
     * Удалить ключ
     */
    async del(key: string): Promise<boolean> {
        try {
            const result = await this.redisClient.del(key);
            this.logger.debug(`Redis DEL: ${key} (deleted: ${result})`);
            return result > 0;
        } catch (error) {
            this.logger.error(`Redis DEL error for key: ${key}`, error);
            return false;
        }
    }

    /**
     * Удалить несколько ключей по паттерну
     * ВНИМАНИЕ: используйте осторожно, может быть медленным
     */
    async delPattern(pattern: string): Promise<number> {
        try {
            const keys = await this.redisClient.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }

            const result = await this.redisClient.del(...keys);
            this.logger.debug(
                `Redis DEL pattern: ${pattern} (deleted: ${result})`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Redis DEL pattern error for: ${pattern}`,
                error,
            );
            return 0;
        }
    }

    /**
     * Проверить существование ключа
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redisClient.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(
                `Redis EXISTS error for key: ${key}`,
                error,
            );
            return false;
        }
    }

    /**
     * Получить TTL ключа
     */
    async ttl(key: string): Promise<number> {
        try {
            return await this.redisClient.ttl(key);
        } catch (error) {
            this.logger.error(`Redis TTL error for key: ${key}`, error);
            return -1;
        }
    }

    /**
     * Получить информацию о Redis
     */
    async info(): Promise<string> {
        try {
            return await this.redisClient.info();
        } catch (error) {
            this.logger.error('Redis INFO error', error);
            return '';
        }
    }

    /**
     * Закрыть подключение
     */
    async disconnect(): Promise<void> {
        try {
            await this.redisClient.quit();
            this.logger.log('Redis connection closed');
        } catch (error) {
            this.logger.error('Error closing Redis connection', error);
        }
    }

    /**
     * Получить Redis client напрямую (для продвинутых операций)
     */
    getClient(): Redis {
        return this.redisClient;
    }
}

