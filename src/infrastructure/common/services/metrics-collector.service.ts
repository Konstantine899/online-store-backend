import { Injectable, Logger } from '@nestjs/common';

/**
 * MetricsCollector
 * In-memory сервис для сбора метрик производительности
 *
 * Цель: MVP решение для агрегации метрик без внешних зависимостей (Redis/Prometheus)
 * Для production: рекомендуется заменить на Prometheus + Grafana
 *
 * Метрики сохраняются в памяти на 24 часа, затем автоматически удаляются
 */
@Injectable()
export class MetricsCollector {
    private readonly logger = new Logger(MetricsCollector.name);
    private readonly METRICS_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

    // Хранилище метрик bulk операций
    private bulkOperations: Array<{
        operation: string;
        duration: number;
        affectedCount: number;
        timestamp: number;
    }> = [];

    // Хранилище медленных SQL запросов
    private slowQueries: Array<{
        sql: string;
        duration: number;
        timestamp: number;
    }> = [];

    // Хранилище ошибок
    private errors: Array<{
        context: string;
        error: string;
        timestamp: number;
    }> = [];

    constructor() {
        // Автоматическая очистка старых метрик каждый час
        setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000);
    }

    /**
     * Записать метрику bulk операции
     */
    public recordBulkOperation(
        operation: string,
        duration: number,
        affectedCount: number,
    ): void {
        this.bulkOperations.push({
            operation,
            duration,
            affectedCount,
            timestamp: Date.now(),
        });
    }

    /**
     * Записать метрику медленного SQL запроса
     */
    public recordSlowQuery(sql: string, duration: number): void {
        this.slowQueries.push({
            sql: sql.substring(0, 200), // Truncate для экономии памяти
            duration,
            timestamp: Date.now(),
        });
    }

    /**
     * Записать ошибку
     */
    public recordError(context: string, error: string): void {
        this.errors.push({
            context,
            error: error.substring(0, 500),
            timestamp: Date.now(),
        });
    }

    /**
     * Получить метрики за последние 24 часа
     */
    public getMetrics(): {
        slowQueriesCount: number;
        avgBulkOperationTime: number;
        totalBulkOperations: number;
        bulkOperationsByType: Record<string, number>;
        errorRate: number;
        timestamp: string;
    } {
        const now = Date.now();
        const cutoff = now - this.METRICS_TTL_MS;

        // Фильтруем метрики за последние 24 часа
        const recentBulkOps = this.bulkOperations.filter(
            (op) => op.timestamp > cutoff,
        );
        const recentSlowQueries = this.slowQueries.filter(
            (q) => q.timestamp > cutoff,
        );
        const recentErrors = this.errors.filter((e) => e.timestamp > cutoff);

        // Вычисляем среднее время bulk операций
        const avgBulkTime =
            recentBulkOps.length > 0
                ? recentBulkOps.reduce((sum, op) => sum + op.duration, 0) /
                  recentBulkOps.length
                : 0;

        // Группируем bulk операции по типу
        const bulkOpsByType: Record<string, number> = {
            bulkActivateUsers: 0,
            bulkDeactivateUsers: 0,
            bulkBlockUsers: 0,
            bulkUnblockUsers: 0,
            bulkDeleteUsers: 0,
            bulkVerifyUsers: 0,
        };

        recentBulkOps.forEach((op) => {
            if (bulkOpsByType[op.operation] !== undefined) {
                bulkOpsByType[op.operation]++;
            }
        });

        // Вычисляем error rate (ошибки / общее количество операций)
        const totalOperations = recentBulkOps.length + recentSlowQueries.length;
        const errorRate =
            totalOperations > 0 ? recentErrors.length / totalOperations : 0;

        return {
            slowQueriesCount: recentSlowQueries.length,
            avgBulkOperationTime: Math.round(avgBulkTime * 100) / 100, // 2 знака после запятой
            totalBulkOperations: recentBulkOps.length,
            bulkOperationsByType: bulkOpsByType,
            errorRate: Math.round(errorRate * 10000) / 10000, // 4 знака после запятой
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Очистка старых метрик (>24 часа)
     * @private
     */
    private cleanupOldMetrics(): void {
        const now = Date.now();
        const cutoff = now - this.METRICS_TTL_MS;

        const beforeCleanup = {
            bulkOps: this.bulkOperations.length,
            slowQueries: this.slowQueries.length,
            errors: this.errors.length,
        };

        this.bulkOperations = this.bulkOperations.filter(
            (op) => op.timestamp > cutoff,
        );
        this.slowQueries = this.slowQueries.filter((q) => q.timestamp > cutoff);
        this.errors = this.errors.filter((e) => e.timestamp > cutoff);

        const afterCleanup = {
            bulkOps: this.bulkOperations.length,
            slowQueries: this.slowQueries.length,
            errors: this.errors.length,
        };

        this.logger.debug(
            {
                before: beforeCleanup,
                after: afterCleanup,
                removed: {
                    bulkOps: beforeCleanup.bulkOps - afterCleanup.bulkOps,
                    slowQueries:
                        beforeCleanup.slowQueries - afterCleanup.slowQueries,
                    errors: beforeCleanup.errors - afterCleanup.errors,
                },
            },
            'Очистка старых метрик (>24ч)',
        );
    }

    /**
     * Сброс всех метрик (для тестов)
     */
    public reset(): void {
        this.bulkOperations = [];
        this.slowQueries = [];
        this.errors = [];
    }
}
