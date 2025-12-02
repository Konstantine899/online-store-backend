import { getConfig } from '@app/infrastructure/config';
import { CacheService } from '@app/infrastructure/services/cache/cache.service';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Типы кэшируемых отчётов
 */
export type AuditReportType = 'summary' | 'timeline';

/**
 * Интерфейс для статистики кэша
 */
export interface IAuditCacheStats {
    summary: {
        hits: number;
        misses: number;
        hitRate: number;
    };
    timeline: {
        hits: number;
        misses: number;
        hitRate: number;
    };
}

/**
 * Сервис кэширования audit отчётов
 *
 * Предоставляет специализированный интерфейс для кэширования отчётов по audit логам:
 * - Summary отчёты (сводная статистика)
 * - Timeline отчёты (история изменений роли)
 *
 * Особенности:
 * - Использует Redis через CacheService
 * - TTL настраивается через AUDIT_CACHE_TTL_SECONDS
 * - Автоматическая инвалидация при создании новых audit логов
 * - Метрики hit/miss для мониторинга
 */
@Injectable()
export class RoleAuditCacheService {
    private readonly logger = new Logger(RoleAuditCacheService.name);
    private readonly auditCacheTTL: number;

    /**
     * Статистика кэша для мониторинга
     */
    private cacheStats = {
        summaryHits: 0,
        summaryMisses: 0,
        timelineHits: 0,
        timelineMisses: 0,
    };

    constructor(private readonly cacheService: CacheService) {
        const config = getConfig();
        this.auditCacheTTL = config.AUDIT_CACHE_TTL_SECONDS;
    }

    /**
     * Сгенерировать ключ кэша для summary отчёта
     */
    private buildSummaryCacheKey(
        startDate: Date,
        endDate: Date,
        tenantId?: number | null,
    ): string {
        const tenant = tenantId ?? 'all';
        return `audit:summary:${tenant}:${startDate.toISOString()}:${endDate.toISOString()}`;
    }

    /**
     * Сгенерировать ключ кэша для timeline отчёта
     */
    private buildTimelineCacheKey(
        roleId: number,
        tenantId?: number | null,
    ): string {
        const tenant = tenantId ?? 'all';
        return `audit:timeline:${tenant}:${roleId}`;
    }

    /**
     * Получить summary отчёт из кэша или вернуть null
     */
    async getSummaryReport<T = unknown>(
        startDate: Date,
        endDate: Date,
        tenantId?: number | null,
    ): Promise<T | null> {
        const cacheKey = this.buildSummaryCacheKey(
            startDate,
            endDate,
            tenantId,
        );
        const cached = await this.cacheService.get<T>(cacheKey);

        if (cached) {
            this.incrementCacheHit('summary');
            this.logger.log({
                cacheKey,
                message: 'Cache HIT: summary report returned from cache',
            });
            return cached;
        }

        this.incrementCacheMiss('summary');
        this.logger.log({
            cacheKey,
            message: 'Cache MISS: summary report not found in cache',
        });
        return null;
    }

    /**
     * Сохранить summary отчёт в кэш
     */
    async setSummaryReport<T = unknown>(
        startDate: Date,
        endDate: Date,
        report: T,
        tenantId?: number | null,
    ): Promise<void> {
        const cacheKey = this.buildSummaryCacheKey(
            startDate,
            endDate,
            tenantId,
        );
        await this.cacheService.set(cacheKey, report, this.auditCacheTTL);
        this.logger.log({
            cacheKey,
            ttl: this.auditCacheTTL,
            message: 'Cache WRITE: summary report cached',
        });
    }

    /**
     * Получить timeline отчёт из кэша или вернуть null
     */
    async getTimelineReport<T = unknown>(
        roleId: number,
        tenantId?: number | null,
    ): Promise<T | null> {
        const cacheKey = this.buildTimelineCacheKey(roleId, tenantId);
        const cached = await this.cacheService.get<T>(cacheKey);

        if (cached) {
            this.incrementCacheHit('timeline');
            this.logger.log({
                cacheKey,
                message: 'Cache HIT: timeline report returned from cache',
            });
            return cached;
        }

        this.incrementCacheMiss('timeline');
        this.logger.log({
            cacheKey,
            message: 'Cache MISS: timeline report not found in cache',
        });
        return null;
    }

    /**
     * Сохранить timeline отчёт в кэш
     */
    async setTimelineReport<T = unknown>(
        roleId: number,
        report: T,
        tenantId?: number | null,
    ): Promise<void> {
        const cacheKey = this.buildTimelineCacheKey(roleId, tenantId);
        await this.cacheService.set(cacheKey, report, this.auditCacheTTL);
        this.logger.log({
            cacheKey,
            ttl: this.auditCacheTTL,
            message: 'Cache WRITE: timeline report cached',
        });
    }

    /**
     * Инвалидировать кэш для указанного тенанта
     * Удаляет все кэшированные отчёты, связанные с этим тенантом
     */
    async invalidateByTenant(tenantId?: number | null): Promise<number> {
        try {
            const pattern = tenantId ? `audit:*:${tenantId}:*` : 'audit:*';
            const deletedCount = await this.cacheService.delPattern(pattern);
            if (deletedCount > 0) {
                this.logger.log({
                    tenantId,
                    pattern,
                    deletedCount,
                    message: 'Audit cache invalidated by tenant',
                });
            }
            return deletedCount;
        } catch (error: unknown) {
            // Логируем ошибку, но не прерываем выполнение
            this.logger.error({
                error: error instanceof Error ? error.message : String(error),
                tenantId,
                message: 'Failed to invalidate audit cache by tenant',
            });
            return 0;
        }
    }

    /**
     * Инвалидировать кэш для конкретной роли
     */
    async invalidateTimelineReport(
        roleId: number,
        tenantId?: number | null,
    ): Promise<boolean> {
        try {
            const cacheKey = this.buildTimelineCacheKey(roleId, tenantId);
            const deletedCount = await this.cacheService.del(cacheKey);
            if (deletedCount > 0) {
                this.logger.log({
                    cacheKey,
                    message: 'Timeline report cache invalidated',
                });
            }
            return deletedCount > 0;
        } catch (error: unknown) {
            this.logger.error({
                error: error instanceof Error ? error.message : String(error),
                roleId,
                tenantId,
                message: 'Failed to invalidate timeline report cache',
            });
            return false;
        }
    }

    /**
     * Инкрементировать счётчик cache hit
     */
    private incrementCacheHit(type: AuditReportType): void {
        if (type === 'summary') {
            this.cacheStats.summaryHits++;
        } else {
            this.cacheStats.timelineHits++;
        }
    }

    /**
     * Инкрементировать счётчик cache miss
     */
    private incrementCacheMiss(type: AuditReportType): void {
        if (type === 'summary') {
            this.cacheStats.summaryMisses++;
        } else {
            this.cacheStats.timelineMisses++;
        }
    }

    /**
     * Получить статистику кэша для мониторинга
     */
    getCacheStats(): IAuditCacheStats {
        const summaryTotal =
            this.cacheStats.summaryHits + this.cacheStats.summaryMisses;
        const timelineTotal =
            this.cacheStats.timelineHits + this.cacheStats.timelineMisses;

        return {
            summary: {
                hits: this.cacheStats.summaryHits,
                misses: this.cacheStats.summaryMisses,
                hitRate:
                    summaryTotal > 0
                        ? this.cacheStats.summaryHits / summaryTotal
                        : 0,
            },
            timeline: {
                hits: this.cacheStats.timelineHits,
                misses: this.cacheStats.timelineMisses,
                hitRate:
                    timelineTotal > 0
                        ? this.cacheStats.timelineHits / timelineTotal
                        : 0,
            },
        };
    }

    /**
     * Сбросить статистику кэша (для тестов и диагностики)
     */
    resetStats(): void {
        this.cacheStats = {
            summaryHits: 0,
            summaryMisses: 0,
            timelineHits: 0,
            timelineMisses: 0,
        };
        this.logger.debug('Cache statistics reset');
    }
}
