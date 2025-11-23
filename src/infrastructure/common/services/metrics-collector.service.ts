import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * MetricsCollector
 * In-memory сервис для сбора метрик производительности
 *
 * Цель: MVP решение для агрегации метрик без внешних зависимостей (Redis/Prometheus)
 * Для production: рекомендуется заменить на Prometheus + Grafana
 *
 * Метрики сохраняются в памяти на 24 часа, затем автоматически удаляются
 *
 * Ограничения:
 * - Максимум 10K записей каждого типа (для предотвращения memory leak)
 * - Не работает при horizontal scaling (каждый instance имеет свои метрики)
 */
@Injectable()
export class MetricsCollector implements OnModuleDestroy {
    private readonly logger = new Logger(MetricsCollector.name);
    private readonly METRICS_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа
    private readonly MAX_METRICS_SIZE = 10000; // Максимум 10K записей каждого типа
    private cleanupInterval?: NodeJS.Timeout;

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

    // Хранилище метрик автоматического назначения ролей
    private roleAutoAssignments: Array<{
        roleName: string;
        reason: string; // e.g., 'assigned', 'already_assigned', 'threshold_not_met', 'error'
        assigned: boolean;
        timestamp: number;
    }> = [];

    constructor() {
        // Автоматическая очистка старых метрик каждый час (только в production)
        if (process.env.NODE_ENV !== 'test') {
            this.cleanupInterval = setInterval(
                () => this.cleanupOldMetrics(),
                60 * 60 * 1000,
            );
        }
    }

    /**
     * Lifecycle hook для очистки resources при уничтожении модуля
     */
    onModuleDestroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.logger.debug('MetricsCollector cleanup interval cleared');
        }
    }

    /**
     * Записать метрику bulk операции
     * FIFO: При достижении лимита удаляются самые старые записи
     */
    public recordBulkOperation(
        operation: string,
        duration: number,
        affectedCount: number,
    ): void {
        // Проверяем размер перед добавлением (FIFO)
        if (this.bulkOperations.length >= this.MAX_METRICS_SIZE) {
            this.bulkOperations.shift(); // Удаляем самую старую запись
        }

        this.bulkOperations.push({
            operation,
            duration,
            affectedCount,
            timestamp: Date.now(),
        });
    }

    /**
     * Записать метрику медленного SQL запроса
     * FIFO: При достижении лимита удаляются самые старые записи
     */
    public recordSlowQuery(sql: string, duration: number): void {
        // Проверяем размер перед добавлением (FIFO)
        if (this.slowQueries.length >= this.MAX_METRICS_SIZE) {
            this.slowQueries.shift(); // Удаляем самую старую запись
        }

        this.slowQueries.push({
            sql: sql.substring(0, 200), // Truncate для экономии памяти
            duration,
            timestamp: Date.now(),
        });
    }

    /**
     * Записать ошибку
     * FIFO: При достижении лимита удаляются самые старые записи
     */
    public recordError(context: string, error: string): void {
        // Проверяем размер перед добавлением (FIFO)
        if (this.errors.length >= this.MAX_METRICS_SIZE) {
            this.errors.shift(); // Удаляем самую старую запись
        }

        this.errors.push({
            context,
            error: error.substring(0, 500),
            timestamp: Date.now(),
        });
    }

    /**
     * Записать метрику автоматического назначения роли
     * FIFO: При достижении лимита удаляются самые старые записи
     * @param roleName - Название роли (VIP_CUSTOMER, WHOLESALE)
     * @param reason - Причина (assigned, already_assigned, threshold_not_met, error, etc.)
     * @param assigned - true если роль была назначена, false в противном случае
     */
    public recordRoleAutoAssignment(
        roleName: string,
        reason: string,
        assigned: boolean,
    ): void {
        // Проверяем размер перед добавлением (FIFO)
        if (this.roleAutoAssignments.length >= this.MAX_METRICS_SIZE) {
            this.roleAutoAssignments.shift(); // Удаляем самую старую запись
        }

        this.roleAutoAssignments.push({
            roleName,
            reason,
            assigned,
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
        totalRoleAutoAssignments: number;
        roleAutoAssignmentsByType: Record<
            string,
            { total: number; assigned: number; failed: number }
        >;
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
        const recentRoleAutoAssignments = this.roleAutoAssignments.filter(
            (item) => item.timestamp > cutoff,
        );

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

        // Группируем автоматические назначения ролей по типу
        const roleAutoAssignmentsByType: Record<
            string,
            { total: number; assigned: number; failed: number }
        > = {};

        recentRoleAutoAssignments.forEach((item) => {
            if (!roleAutoAssignmentsByType[item.roleName]) {
                roleAutoAssignmentsByType[item.roleName] = {
                    total: 0,
                    assigned: 0,
                    failed: 0,
                };
            }
            roleAutoAssignmentsByType[item.roleName].total++;
            if (item.assigned) {
                roleAutoAssignmentsByType[item.roleName].assigned++;
            } else {
                roleAutoAssignmentsByType[item.roleName].failed++;
            }
        });

        return {
            slowQueriesCount: recentSlowQueries.length,
            avgBulkOperationTime: Math.round(avgBulkTime * 100) / 100, // 2 знака после запятой
            totalBulkOperations: recentBulkOps.length,
            bulkOperationsByType: bulkOpsByType,
            errorRate: Math.round(errorRate * 10000) / 10000, // 4 знака после запятой
            totalRoleAutoAssignments: recentRoleAutoAssignments.length,
            roleAutoAssignmentsByType: roleAutoAssignmentsByType,
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
            roleAutoAssignments: this.roleAutoAssignments.length,
        };

        this.bulkOperations = this.bulkOperations.filter(
            (op) => op.timestamp > cutoff,
        );
        this.slowQueries = this.slowQueries.filter((q) => q.timestamp > cutoff);
        this.errors = this.errors.filter((e) => e.timestamp > cutoff);
        this.roleAutoAssignments = this.roleAutoAssignments.filter(
            (item) => item.timestamp > cutoff,
        );

        const afterCleanup = {
            bulkOps: this.bulkOperations.length,
            slowQueries: this.slowQueries.length,
            errors: this.errors.length,
        };

        const removed = {
            bulkOps: beforeCleanup.bulkOps - afterCleanup.bulkOps,
            slowQueries: beforeCleanup.slowQueries - afterCleanup.slowQueries,
            errors: beforeCleanup.errors - afterCleanup.errors,
        };

        // Логируем для мониторинга memory usage
        this.logger.debug(
            {
                before: beforeCleanup,
                after: afterCleanup,
                removed,
                maxSize: this.MAX_METRICS_SIZE,
                memoryPressure: {
                    bulkOps: `${((afterCleanup.bulkOps / this.MAX_METRICS_SIZE) * 100).toFixed(1)}%`,
                    slowQueries: `${((afterCleanup.slowQueries / this.MAX_METRICS_SIZE) * 100).toFixed(1)}%`,
                    errors: `${((afterCleanup.errors / this.MAX_METRICS_SIZE) * 100).toFixed(1)}%`,
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
