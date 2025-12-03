import { MetricsCollector } from '@app/infrastructure/common/services';
import { getConfig } from '@app/infrastructure/config';
import { RoleRepository } from '@app/infrastructure/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RoleService } from './role.service';

/**
 * Сервис для автоматической деактивации истекших ролей.
 *
 * Выполняет периодические задачи:
 * - Деактивация истекших ролей (expiresAt < текущей даты)
 * - Batch обработка для предотвращения блокировки БД
 * - Логирование процесса деактивации
 * - Запись метрик в MetricsCollector
 *
 * @schedule '0 4 * * *' (каждый день в 04:00 AM по времени сервера)
 */
@Injectable()
export class RoleExpirationService {
    private readonly logger = new Logger(RoleExpirationService.name);

    constructor(
        private readonly roleService: RoleService,
        private readonly roleRepository: RoleRepository,
        private readonly metricsCollector: MetricsCollector,
    ) {}

    /**
     * CRON Job: Деактивация истекших ролей.
     *
     * Находит все активные роли, у которых expiresAt < текущей даты,
     * и деактивирует их через batch операцию для предотвращения блокировки БД.
     *
     * @schedule '0 4 * * *' (каждый день в 04:00 AM по времени сервера)
     */
    @Cron(CronExpression.EVERY_DAY_AT_4AM, {
        name: 'deactivate-expired-roles',
        timeZone: 'Europe/Moscow',
    })
    async deactivateExpiredRoles(): Promise<void> {
        const startTime = Date.now();
        try {
            const config = getConfig();
            const batchSize = config.ROLE_EXPIRATION_BATCH_SIZE ?? 1000;

            if (this.logger) {
                this.logger.log({
                    batchSize,
                    message: 'Начинается деактивация истекших ролей',
                });
            }

            let totalDeactivated = 0;
            let hasMore = true;

            // Обрабатываем batch'ами, пока есть истекшие роли
            while (hasMore) {
                const deactivatedCount =
                    await this.roleService.deactivateExpiredRoles(batchSize);

                totalDeactivated += deactivatedCount;
                hasMore = deactivatedCount === batchSize;

                // Небольшая пауза между batch'ами для предотвращения блокировки БД
                if (hasMore) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }

            const duration = Date.now() - startTime;
            this.metricsCollector.recordBulkOperation(
                'deactivateExpiredRoles',
                duration,
                totalDeactivated,
            );

            if (this.logger) {
                this.logger.log({
                    event: 'expired_roles_deactivation_completed',
                    totalDeactivated,
                    durationMs: duration,
                    message: `Деактивировано ${totalDeactivated} истекших ролей за ${duration}ms`,
                });
            }
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            if (this.metricsCollector) {
                this.metricsCollector.recordError(
                    'RoleExpirationService',
                    error instanceof Error ? error.message : String(error),
                );
            }
            if (this.logger) {
                this.logger.error({
                    event: 'expired_roles_deactivation_failed',
                    error:
                        error instanceof Error ? error.message : String(error),
                    durationMs: duration,
                    message: 'Ошибка при деактивации истекших ролей',
                });
            }
            throw error;
        }
    }

    /**
     * Ручной запуск деактивации истекших ролей (для тестирования или администрирования)
     * @param batchSize - Размер batch для обработки
     * @param beforeDate - Дата до которой искать истекшие роли (опционально)
     * @returns Количество деактивированных ролей
     */
    async runManualDeactivation(
        batchSize?: number,
        beforeDate?: Date,
    ): Promise<number> {
        const startTime = Date.now();
        try {
            const config = getConfig();
            const effectiveBatchSize =
                batchSize ?? config.ROLE_EXPIRATION_BATCH_SIZE ?? 1000;

            if (this.logger) {
                this.logger.log({
                    batchSize: effectiveBatchSize,
                    beforeDate: beforeDate?.toISOString(),
                    message: 'Ручная деактивация истекших ролей',
                });
            }

            let totalDeactivated = 0;
            let hasMore = true;

            while (hasMore) {
                const deactivatedCount =
                    await this.roleService.deactivateExpiredRoles(
                        effectiveBatchSize,
                        beforeDate,
                    );

                totalDeactivated += deactivatedCount;
                hasMore = deactivatedCount === effectiveBatchSize;

                if (hasMore) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }

            const duration = Date.now() - startTime;
            this.metricsCollector.recordBulkOperation(
                'deactivateExpiredRoles',
                duration,
                totalDeactivated,
            );

            if (this.logger) {
                this.logger.log({
                    event: 'expired_roles_deactivation_manual_completed',
                    totalDeactivated,
                    durationMs: duration,
                    message: `Ручная деактивация завершена: удалено ${totalDeactivated} записей`,
                });
            }

            return totalDeactivated;
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            if (this.metricsCollector) {
                this.metricsCollector.recordError(
                    'RoleExpirationService',
                    error instanceof Error ? error.message : String(error),
                );
            }
            if (this.logger) {
                this.logger.error({
                    event: 'expired_roles_deactivation_manual_failed',
                    error:
                        error instanceof Error ? error.message : String(error),
                    durationMs: duration,
                    message: 'Ошибка при ручной деактивации истекших ролей',
                });
            }
            throw error;
        }
    }

    /**
     * CRON Job: Автоматическое продление ролей.
     *
     * Находит роли с активной конфигурацией автоматического продления,
     * которые истекают в ближайшие 1-3 дня, и продлевает их автоматически.
     *
     * @schedule '0 3 * * *' (каждый день в 03:00 AM, перед деактивацией в 04:00)
     */
    @Cron('0 3 * * *', {
        name: 'auto-renew-roles',
        timeZone: 'Europe/Moscow',
    })
    async autoRenewRoles(): Promise<void> {
        const startTime = Date.now();
        try {
            const config = getConfig();
            const daysUntilExpiration = 3; // Продлеваем роли, которые истекают в ближайшие 3 дня
            const batchSize = config.ROLE_EXPIRATION_BATCH_SIZE ?? 1000;

            if (this.logger) {
                this.logger.log({
                    daysUntilExpiration,
                    batchSize,
                    message: 'Начинается автоматическое продление ролей',
                });
            }

            let totalRenewed = 0;
            let hasMore = true;

            // Обрабатываем batch'ами
            while (hasMore) {
                const rolesToRenew =
                    await this.roleRepository.findRolesWithAutoRenewalExpiringSoon(
                        daysUntilExpiration,
                        batchSize,
                    );

                if (rolesToRenew.length === 0) {
                    hasMore = false;
                    break;
                }

                // Продлеваем каждую роль
                const renewalPromises = rolesToRenew.map((roleData) =>
                    this.roleService.autoRenewRole(roleData.userRoleId),
                );

                const results = await Promise.allSettled(renewalPromises);
                const renewed = results.filter(
                    (r) => r.status === 'fulfilled' && r.value === true,
                ).length;

                totalRenewed += renewed;
                hasMore = rolesToRenew.length === batchSize;

                if (hasMore) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }

            const duration = Date.now() - startTime;
            this.metricsCollector.recordBulkOperation(
                'autoRenewRoles',
                duration,
                totalRenewed,
            );

            if (this.logger) {
                this.logger.log({
                    event: 'auto_renew_roles_completed',
                    totalRenewed,
                    durationMs: duration,
                    message: `Автоматически продлено ${totalRenewed} ролей за ${duration}ms`,
                });
            }
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            if (this.metricsCollector) {
                this.metricsCollector.recordError(
                    'RoleExpirationService',
                    error instanceof Error ? error.message : String(error),
                );
            }
            if (this.logger) {
                this.logger.error({
                    event: 'auto_renew_roles_failed',
                    error:
                        error instanceof Error ? error.message : String(error),
                    durationMs: duration,
                    message: 'Ошибка при автоматическом продлении ролей',
                });
            }
            // НЕ выбрасываем исключение, чтобы не сломать cron job
        }
    }

    /**
     * Ручной запуск автоматического продления ролей (для тестирования или администрирования)
     * @param daysUntilExpiration - Количество дней до истечения для поиска ролей (по умолчанию 3)
     * @param batchSize - Размер batch для обработки
     * @returns Количество продленных ролей
     */
    async runManualAutoRenewal(
        daysUntilExpiration: number = 3,
        batchSize?: number,
    ): Promise<number> {
        const startTime = Date.now();
        try {
            const config = getConfig();
            const effectiveBatchSize =
                batchSize ?? config.ROLE_EXPIRATION_BATCH_SIZE ?? 1000;

            if (this.logger) {
                this.logger.log({
                    daysUntilExpiration,
                    batchSize: effectiveBatchSize,
                    message: 'Ручное автоматическое продление ролей',
                });
            }

            let totalRenewed = 0;
            let hasMore = true;

            // Обрабатываем batch'ами
            while (hasMore) {
                const rolesToRenew =
                    await this.roleRepository.findRolesWithAutoRenewalExpiringSoon(
                        daysUntilExpiration,
                        effectiveBatchSize,
                    );

                if (rolesToRenew.length === 0) {
                    hasMore = false;
                    break;
                }

                // Продлеваем каждую роль
                const renewalPromises = rolesToRenew.map((roleData) =>
                    this.roleService.autoRenewRole(roleData.userRoleId),
                );

                const results = await Promise.allSettled(renewalPromises);
                const renewed = results.filter(
                    (r) => r.status === 'fulfilled' && r.value === true,
                ).length;

                totalRenewed += renewed;

                hasMore = rolesToRenew.length === effectiveBatchSize;

                if (hasMore) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }

            const duration = Date.now() - startTime;
            this.metricsCollector.recordBulkOperation(
                'autoRenewRoles',
                duration,
                totalRenewed,
            );

            if (this.logger) {
                this.logger.log({
                    event: 'auto_renew_roles_manual_completed',
                    totalRenewed,
                    durationMs: duration,
                    message: `Ручное продление завершено: продлено ${totalRenewed} ролей за ${duration}ms`,
                });
            }

            return totalRenewed;
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            if (this.metricsCollector) {
                this.metricsCollector.recordError(
                    'RoleExpirationService',
                    error instanceof Error ? error.message : String(error),
                );
            }
            if (this.logger) {
                this.logger.error({
                    event: 'auto_renew_roles_manual_failed',
                    error:
                        error instanceof Error ? error.message : String(error),
                    durationMs: duration,
                    message: 'Ошибка при ручном автоматическом продлении ролей',
                });
            }
            throw error;
        }
    }
}
