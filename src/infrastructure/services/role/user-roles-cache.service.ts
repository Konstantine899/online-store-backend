import {
    REDIS_KEY_PREFIXES,
    RedisService,
} from '@app/infrastructure/common/redis';
import type { UserRoleInfo } from '@app/infrastructure/responses/role/user-roles.response';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Сервис кэширования пользовательских ролей в Redis
 *
 * Кэширует результаты getUserRoles(userId, tenantId) для быстрого доступа
 * TTL: 15 минут (по умолчанию)
 */
@Injectable()
export class UserRolesCacheService {
    private readonly logger = new Logger(UserRolesCacheService.name);
    private readonly TTL = 900; // 15 минут в секундах

    constructor(private readonly redisService: RedisService) {}

    /**
     * Получить ключ Redis для пользовательских ролей
     */
    private getUserRolesKey(userId: number, tenantId: number): string {
        return `${REDIS_KEY_PREFIXES.USER_ROLES}${tenantId}:${userId}`;
    }

    /**
     * Получить ключ паттерн для всех ролей пользователя (все тенанты)
     */
    private getUserRolesPattern(userId: number): string {
        return `${REDIS_KEY_PREFIXES.USER_ROLES}*:${userId}`;
    }

    /**
     * Получить ключ паттерн для всех пользовательских ролей
     */
    private getRoleUsersPattern(): string {
        return `${REDIS_KEY_PREFIXES.USER_ROLES}*`;
    }

    /**
     * Получить роли пользователя из кэша
     *
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Массив ролей или null если не закэшировано
     */
    async getUserRoles(
        userId: number,
        tenantId: number,
    ): Promise<UserRoleInfo[] | null> {
        try {
            const key = this.getUserRolesKey(userId, tenantId);
            const cached = await this.redisService.get<UserRoleInfo[]>(key);

            if (cached) {
                this.logger.debug(
                    `Cache HIT: user ${userId} roles in tenant ${tenantId}`,
                );
                return cached;
            }

            this.logger.debug(
                `Cache MISS: user ${userId} roles in tenant ${tenantId}`,
            );
            return null;
        } catch (error) {
            this.logger.error('Error getting user roles from cache', error);
            return null;
        }
    }

    /**
     * Сохранить роли пользователя в кэш
     *
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @param roles - Массив ролей
     * @param ttl - TTL в секундах (по умолчанию 15 минут)
     */
    async setUserRoles(
        userId: number,
        tenantId: number,
        roles: UserRoleInfo[],
        ttl: number = this.TTL,
    ): Promise<boolean> {
        try {
            const key = this.getUserRolesKey(userId, tenantId);
            const success = await this.redisService.set(key, roles, ttl);

            if (success) {
                this.logger.debug(
                    `Cached user ${userId} roles in tenant ${tenantId} (${roles.length} roles, TTL: ${ttl}s)`,
                );
            }

            return success;
        } catch (error) {
            this.logger.error('Error setting user roles to cache', error);
            return false;
        }
    }

    /**
     * Инвалидировать кэш ролей конкретного пользователя в конкретном тенанте
     *
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     */
    async invalidateUserRoles(
        userId: number,
        tenantId: number,
    ): Promise<boolean> {
        try {
            const key = this.getUserRolesKey(userId, tenantId);
            const deleted = await this.redisService.del(key);

            this.logger.debug(
                `Invalidated user ${userId} roles in tenant ${tenantId}`,
            );

            return deleted;
        } catch (error) {
            this.logger.error('Error invalidating user roles cache', error);
            return false;
        }
    }

    /**
     * Инвалидировать все роли пользователя во всех тенантах
     *
     * @param userId - ID пользователя
     */
    async invalidateAllUserRoles(userId: number): Promise<number> {
        try {
            const pattern = this.getUserRolesPattern(userId);
            const deleted = await this.redisService.delPattern(pattern);

            this.logger.debug(
                `Invalidated all roles for user ${userId} (${deleted} keys deleted)`,
            );

            return deleted;
        } catch (error) {
            this.logger.error('Error invalidating all user roles cache', error);
            return 0;
        }
    }

    /**
     * Инвалидировать кэш всех пользователей, у которых есть определённая роль
     * Используется при изменении/удалении роли
     *
     * @param roleId - ID роли
     */
    async invalidateByRoleId(roleId: number): Promise<number> {
        try {
            const pattern = this.getRoleUsersPattern();
            let deleted = 0;

            // Использовать SCAN вместо keys() для неблокирующей операции
            for await (const batch of this.redisService.scanKeys(
                pattern,
                100,
            )) {
                // Параллельная обработка батча для оптимизации
                const deletions = await Promise.all(
                    batch.map(async (key) => {
                        const roles =
                            await this.redisService.get<UserRoleInfo[]>(key);
                        if (roles?.some((r) => r.roleId === roleId)) {
                            await this.redisService.del(key);
                            return 1;
                        }
                        return 0;
                    }),
                );

                deleted += deletions.reduce(
                    (sum: number, d: number) => sum + d,
                    0,
                );
            }

            this.logger.debug(
                `Invalidated cache for ${deleted} users with role ${roleId}`,
            );

            return deleted;
        } catch (error) {
            this.logger.error('Error invalidating cache by role ID', error);
            return 0;
        }
    }

    /**
     * Получить статистику кэша
     */
    async getStats(): Promise<{
        totalKeys: number;
        memoryUsage: string;
    }> {
        try {
            let totalKeys = 0;

            // Использовать SCAN вместо keys() для неблокирующей операции
            for await (const batch of this.redisService.scanKeys(
                `${REDIS_KEY_PREFIXES.USER_ROLES}*`,
                100,
            )) {
                totalKeys += batch.length;
            }

            const info = await this.redisService.info();
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'N/A';

            return {
                totalKeys,
                memoryUsage,
            };
        } catch (error) {
            this.logger.error('Error getting cache stats', error);
            return {
                totalKeys: 0,
                memoryUsage: 'N/A',
            };
        }
    }
}
