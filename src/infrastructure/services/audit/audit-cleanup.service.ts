import { getConfig } from '@app/infrastructure/config';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from './audit.service';

/**
 * Сервис для автоматической очистки старых audit логов.
 *
 * Выполняет периодические задачи:
 * - Очистка audit логов старше указанного количества дней (AUDIT_LOG_RETENTION_DAYS)
 * - Batch удаление для предотвращения блокировки БД
 * - Логирование процесса очистки
 * - Запись метрик в MetricsCollector
 *
 * @schedule '0 2 * * *' (каждый день в 02:00 AM по времени сервера)
 */
@Injectable()
export class AuditCleanupService {
    private readonly logger = new Logger(AuditCleanupService.name);

    constructor(
        private readonly auditService: AuditService,
        private readonly metricsCollector: MetricsCollector,
    ) {}

    /**
     * CRON Job: Очистка старых audit логов.
     *
     * Удаляет логи старше AUDIT_LOG_RETENTION_DAYS дней для освобождения места в БД.
     * Использует batch удаление для предотвращения блокировки БД при больших объёмах данных.
     *
     * @schedule '0 2 * * *' (каждый день в 02:00 AM по времени сервера)
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM, {
        name: 'cleanup-audit-logs',
        timeZone: 'Europe/Moscow',
    })
    async cleanupOldAuditLogs(): Promise<void> {
        const startTime = Date.now();

        try {
            const config = getConfig();
            const retentionDays = config.AUDIT_LOG_RETENTION_DAYS;

            // Вычисляем дату отсечки (логи старше этой даты будут удалены)
            const cutoffDate = new Date(
                Date.now() - retentionDays * 24 * 60 * 60 * 1000,
            );

            this.logger.log({
                retentionDays,
                cutoffDate: cutoffDate.toISOString(),
                message: `Начинается очистка audit логов старше ${retentionDays} дней`,
            });

            // Используем batch удаление для предотвращения блокировки БД
            const deletedCount =
                await this.auditService.deleteOldLogsBatch(cutoffDate);

            const duration = Date.now() - startTime;

            // Записываем метрики в MetricsCollector
            this.metricsCollector.recordBulkOperation(
                'cleanupAuditLogs',
                duration,
                deletedCount,
            );

            this.logger.log({
                event: 'audit_logs_cleanup_completed',
                deletedCount,
                retentionDays,
                cutoffDate: cutoffDate.toISOString(),
                durationMs: duration,
                message: `Очищено ${deletedCount} audit логов старше ${retentionDays} дней за ${duration}ms`,
            });
        } catch (error: unknown) {
            const duration = Date.now() - startTime;

            // Записываем ошибку в метрики
            this.metricsCollector.recordError(
                'AuditCleanupService',
                error instanceof Error ? error.message : String(error),
            );

            this.logger.error({
                event: 'audit_logs_cleanup_failed',
                error: error instanceof Error ? error.message : String(error),
                durationMs: duration,
                message: 'Ошибка при очистке audit логов',
            });

            // НЕ выбрасываем исключение (чтобы не сломать приложение)
            // Следующий запуск CRON попробует снова
        }
    }

    /**
     * Метод для ручного запуска cleanup (для тестов и админки).
     *
     * @returns {Promise<number>} - количество удалённых записей
     */
    async runManualCleanup(): Promise<number> {
        const startTime = Date.now();

        try {
            const config = getConfig();
            const retentionDays = config.AUDIT_LOG_RETENTION_DAYS;
            const cutoffDate = new Date(
                Date.now() - retentionDays * 24 * 60 * 60 * 1000,
            );

            const deletedCount =
                await this.auditService.deleteOldLogsBatch(cutoffDate);

            const duration = Date.now() - startTime;

            this.metricsCollector.recordBulkOperation(
                'cleanupAuditLogs',
                duration,
                deletedCount,
            );

            this.logger.log({
                event: 'audit_logs_cleanup_manual_completed',
                deletedCount,
                durationMs: duration,
                message: `Ручная очистка завершена: удалено ${deletedCount} записей`,
            });

            return deletedCount;
        } catch (error: unknown) {
            const duration = Date.now() - startTime;

            this.metricsCollector.recordError(
                'AuditCleanupService',
                error instanceof Error ? error.message : String(error),
            );

            this.logger.error({
                event: 'audit_logs_cleanup_manual_failed',
                error: error instanceof Error ? error.message : String(error),
                durationMs: duration,
                message: 'Ошибка при ручной очистке audit логов',
            });

            throw error;
        }
    }
}

