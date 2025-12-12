import { RoleModel } from '@app/domain/models';
import { RoleRepository } from '@app/infrastructure/repositories';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Сервис кэширования ролей
 * Использует in-memory Map для кэширования системных ролей
 *
 * Цель: уменьшить количество запросов к БД для часто используемых системных ролей
 * (VIP_CUSTOMER, WHOLESALE_CUSTOMER, ADMIN, MODERATOR и т.д.)
 *
 * Особенности:
 * - TTL: 1 час (автоматическая инвалидация устаревших записей)
 * - Max size: 50 записей (LRU eviction при превышении)
 * - Только системные роли (isSystemRole: true)
 */
@Injectable()
export class RoleCacheService {
    private readonly logger = new Logger(RoleCacheService.name);

    /**
     * TTL для кэша (1 час)
     */
    private readonly TTL_MS = 3600000; // 1 hour

    /**
     * Максимальный размер кэша
     */
    private readonly MAX_CACHE_SIZE = 50;

    /**
     * In-memory кэш ролей с метаданными
     * Key: имя роли (role)
     * Value: { role: RoleModel, cachedAt: timestamp }
     */
    private readonly cache = new Map<
        string,
        { role: RoleModel; cachedAt: number }
    >();

    /**
     * Статистика кэша для мониторинга
     */
    private stats = {
        hits: 0,
        misses: 0,
        invalidations: 0,
        evictions: 0, // Количество вытеснений по LRU
    };

    constructor(private readonly roleRepository: RoleRepository) {}

    /**
     * Получить роль из кэша или БД
     * @param roleName - Имя роли
     * @returns RoleModel или null, если роль не найдена
     */
    public async getCachedRole(roleName: string): Promise<RoleModel | null> {
        // 1. Проверить кэш и TTL
        const cached = this.cache.get(roleName);
        if (cached) {
            const age = Date.now() - cached.cachedAt;
            if (age < this.TTL_MS) {
                this.stats.hits++;
                this.logger.debug(
                    `Cache HIT для роли: ${roleName} (age: ${Math.round(age / 1000)}s)`,
                );
                return cached.role;
            } else {
                // TTL истек - удалить из кэша
                this.cache.delete(roleName);
                this.stats.invalidations++;
                this.logger.debug(
                    `Cache TTL expired для роли: ${roleName} (age: ${Math.round(age / 1000)}s)`,
                );
            }
        }

        // 2. Кэш промах - запросить из БД
        this.stats.misses++;
        this.logger.debug(`Cache MISS для роли: ${roleName}`);

        const role = await this.roleRepository.findRoleByName(roleName);

        // 3. Кэшировать только системные роли
        if (role?.isSystemRole) {
            // 3.1. Проверить размер кэша (LRU eviction)
            if (this.cache.size >= this.MAX_CACHE_SIZE) {
                const firstKey = this.cache.keys().next().value;
                if (firstKey) {
                    this.cache.delete(firstKey);
                    this.stats.evictions++;
                    this.logger.warn(
                        `Cache size limit (${this.MAX_CACHE_SIZE}) reached, evicted: ${firstKey}`,
                    );
                }
            }

            // 3.2. Добавить в кэш с timestamp
            this.cache.set(roleName, { role, cachedAt: Date.now() });
            this.logger.debug(
                `Роль ${roleName} закэширована (isSystemRole: ${role.isSystemRole})`,
            );
        }

        return role;
    }

    /**
     * Инвалидировать (удалить) роль из кэша
     * Используется при обновлении или удалении роли
     * @param roleName - Имя роли
     */
    public invalidate(roleName: string): void {
        const deleted = this.cache.delete(roleName);
        if (deleted) {
            this.stats.invalidations++;
            this.logger.debug(`Роль ${roleName} удалена из кэша`);
        }
    }

    /**
     * Очистить весь кэш
     * Используется при массовых изменениях ролей или для тестирования
     */
    public invalidateAll(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.invalidations += size;
        this.logger.debug(`Весь кэш очищен (${size} ролей удалено)`);
    }

    /**
     * Получить статистику кэша
     * Для мониторинга и отладки
     */
    public getStats(): {
        hits: number;
        misses: number;
        invalidations: number;
        evictions: number;
        size: number;
        hitRate: number;
        ttlMs: number;
        maxSize: number;
    } {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            invalidations: this.stats.invalidations,
            evictions: this.stats.evictions,
            size: this.cache.size,
            hitRate: Math.round(hitRate * 100) / 100, // округлить до 2 знаков
            ttlMs: this.TTL_MS,
            maxSize: this.MAX_CACHE_SIZE,
        };
    }

    /**
     * Сбросить статистику кэша
     *
     * @remarks
     * Используется:
     * - В тестах для изоляции между test cases
     * - При ручной диагностике в production (через admin endpoint)
     * - Не влияет на сам кэш, только на счетчики
     *
     * @example
     * ```typescript
     * // В тестах:
     * beforeEach(() => {
     *     roleCacheService.resetStats();
     * });
     *
     * // В production (через endpoint):
     * POST /online-store/role/cache/reset-stats
     * ```
     */
    public resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            invalidations: 0,
            evictions: 0,
        };
        this.logger.debug('Статистика кэша сброшена');
    }

    /**
     * Предзагрузить системные роли в кэш
     * Вызывается при инициализации приложения
     * @param roleNames - Массив имен ролей для предзагрузки
     */
    public async warmUp(roleNames: string[]): Promise<void> {
        this.logger.log(
            `Предзагрузка системных ролей в кэш: ${roleNames.join(', ')}`,
        );

        const promises = roleNames.map((roleName) =>
            this.getCachedRole(roleName),
        );

        const results = await Promise.all(promises);
        const loaded = results.filter((r) => r !== null).length;

        this.logger.log(
            `Предзагрузка завершена: ${loaded}/${roleNames.length} ролей закэшированы`,
        );
    }
}
