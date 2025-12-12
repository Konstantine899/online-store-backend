import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor для мониторинга производительности endpoints
 * Логирует медленные запросы (>500ms)
 * Поддерживает multi-tenant изоляцию и статистику
 */
@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
    private readonly logger = new Logger('PerformanceMonitoring');
    private readonly SLOW_QUERY_THRESHOLD_MS = 500;

    private slowQueries: Array<{
        method: string;
        route: string;
        duration: number;
        timestamp: string;
        tenantId: number | null;
    }> = [];

    // Статистика per tenant
    private tenantStats: Map<
        number,
        {
            slowQueryCount: number;
            totalDuration: number;
            maxDuration: number;
            avgDuration: number;
        }
    > = new Map();

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, path } = request;
        const user = (request as Request & { user?: { tenantId?: number } })
            .user;
        const tenantId = user?.tenantId ?? null;
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;

                // Логировать медленные запросы
                if (duration > this.SLOW_QUERY_THRESHOLD_MS) {
                    const sanitizedRoute = this.sanitizeRoute(path);

                    const slowQuery = {
                        method,
                        route: sanitizedRoute,
                        duration,
                        timestamp: new Date().toISOString(),
                        tenantId,
                    };

                    this.slowQueries.push(slowQuery);

                    // Хранить только последние 100 записей
                    if (this.slowQueries.length > 100) {
                        this.slowQueries.shift();
                    }

                    // Обновить tenant-specific статистику
                    if (tenantId !== null) {
                        this.updateTenantStats(tenantId, duration);
                    }

                    this.logger.warn(
                        `🐌 Slow query detected: ${method} ${sanitizedRoute} took ${duration}ms (tenant: ${tenantId ?? 'null'})`,
                        {
                            method,
                            route: sanitizedRoute,
                            duration,
                            threshold: this.SLOW_QUERY_THRESHOLD_MS,
                            tenantId,
                        },
                    );
                }

                // Логировать все запросы на debug уровне
                this.logger.debug(
                    `${method} ${path} completed in ${duration}ms (tenant: ${tenantId ?? 'null'})`,
                );
            }),
        );
    }

    /**
     * Замаскировать ID в путях для защиты данных
     * @example /role/user/123 -> /role/user/:id
     */
    private sanitizeRoute(path: string): string {
        return path.replace(/\/\d+/g, '/:id');
    }

    /**
     * Обновить статистику для тенанта
     */
    private updateTenantStats(tenantId: number, duration: number): void {
        const stats = this.tenantStats.get(tenantId) ?? {
            slowQueryCount: 0,
            totalDuration: 0,
            maxDuration: 0,
            avgDuration: 0,
        };

        stats.slowQueryCount++;
        stats.totalDuration += duration;
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        stats.avgDuration = Math.round(
            stats.totalDuration / stats.slowQueryCount,
        );

        this.tenantStats.set(tenantId, stats);
    }

    /**
     * Получить статистику медленных запросов
     * @param requestorTenantId - ID тенанта запрашивающего (null для SUPER_ADMIN)
     */
    getSlowQueries(requestorTenantId: number | null = null): Array<{
        method: string;
        route: string;
        duration: number;
        timestamp: string;
    }> {
        // SUPER_ADMIN (tenantId === null) видит все запросы
        // Остальные видят только свои
        const filtered =
            requestorTenantId === null
                ? this.slowQueries
                : this.slowQueries.filter(
                      (q) => q.tenantId === requestorTenantId,
                  );

        return filtered.map((q) => ({
            method: q.method,
            route: q.route,
            duration: q.duration,
            timestamp: q.timestamp,
        }));
    }

    /**
     * Очистить статистику
     */
    clearSlowQueries(): void {
        this.slowQueries = [];
        this.logger.log('Статистика медленных запросов очищена');
    }

    /**
     * Получить сводную статистику
     */
    getStats(): {
        totalSlowQueries: number;
        averageDuration: number;
        maxDuration: number;
        slowestRoute: string;
    } {
        if (this.slowQueries.length === 0) {
            return {
                totalSlowQueries: 0,
                averageDuration: 0,
                maxDuration: 0,
                slowestRoute: 'N/A',
            };
        }

        const totalDuration = this.slowQueries.reduce(
            (sum, q) => sum + q.duration,
            0,
        );
        const averageDuration = totalDuration / this.slowQueries.length;

        const slowest = this.slowQueries.reduce((prev, current) =>
            prev.duration > current.duration ? prev : current,
        );

        return {
            totalSlowQueries: this.slowQueries.length,
            averageDuration: Math.round(averageDuration),
            maxDuration: slowest.duration,
            slowestRoute: `${slowest.method} ${slowest.route}`,
        };
    }

    /**
     * Получить статистику конкретного тенанта
     */
    getTenantStats(tenantId: number): {
        slowQueryCount: number;
        totalDuration: number;
        maxDuration: number;
        avgDuration: number;
    } {
        return (
            this.tenantStats.get(tenantId) ?? {
                slowQueryCount: 0,
                totalDuration: 0,
                maxDuration: 0,
                avgDuration: 0,
            }
        );
    }

    /**
     * Получить топ N проблемных тенантов
     * @param limit - количество тенантов (default: 10)
     */
    getTopNoisyTenants(limit: number = 10): Array<{
        tenantId: number;
        slowQueryCount: number;
        avgDuration: number;
        maxDuration: number;
    }> {
        return Array.from(this.tenantStats.entries())
            .sort((a, b) => b[1].slowQueryCount - a[1].slowQueryCount)
            .slice(0, limit)
            .map(([tenantId, stats]) => ({
                tenantId,
                slowQueryCount: stats.slowQueryCount,
                avgDuration: stats.avgDuration,
                maxDuration: stats.maxDuration,
            }));
    }

    /**
     * Очистить статистику тенантов
     */
    clearTenantStats(): void {
        this.tenantStats.clear();
        this.logger.log('Статистика тенантов очищена');
    }
}
