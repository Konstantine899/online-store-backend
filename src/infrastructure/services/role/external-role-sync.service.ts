import { AuditAction, SyncType } from '@app/domain/models';
import { IExternalRoleSyncRepository } from '@app/domain/repositories';
import {
    IExternalRoleSyncService,
    ISyncResult,
    ISyncStatus,
} from '@app/domain/services/role/i-external-role-sync.service';
import { TenantContext } from '@app/infrastructure/common/context';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { AuditService } from '@app/infrastructure/services/audit/audit.service';
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    Optional,
} from '@nestjs/common';
import { CronJob } from 'cron';
import { ExternalRoleProviderFactory } from './external-role-provider.factory';
import { LDAPRoleSyncService } from './ldap/ldap-role-sync.service';

/**
 * ExternalRoleSyncService
 *
 * Главный сервис синхронизации внешних систем управления ролями.
 * Координирует работу провайдеров (LDAP, AD, SSO) и управляет синхронизацией пользователей.
 *
 * Функциональность:
 * - Синхронизация для конкретной конфигурации (syncTenant)
 * - Синхронизация всех активных конфигураций (syncAllTenants)
 * - Получение статуса синхронизации (getSyncStatus)
 * - Повтор failed синхронизаций (retryFailedSync)
 * - Управление автоматической синхронизацией (pauseSync, resumeSync)
 * - Тестирование подключения к провайдеру (testConnection)
 *
 * Примечание: SSO провайдеры не поддерживают batch синхронизацию,
 * они работают через just-in-time provisioning при SSO входе.
 */
@Injectable()
export class ExternalRoleSyncService implements IExternalRoleSyncService {
    private readonly logger = new Logger(ExternalRoleSyncService.name);

    constructor(
        @Inject('IExternalRoleSyncRepository')
        private readonly externalRoleSyncRepository: IExternalRoleSyncRepository,
        private readonly providerFactory: ExternalRoleProviderFactory,
        private readonly ldapRoleSyncService: LDAPRoleSyncService,
        private readonly tenantContext: TenantContext,
        private readonly metricsCollector: MetricsCollector,
        @Optional()
        private readonly auditService?: AuditService,
    ) {}

    /**
     * Синхронизировать пользователей для конкретной конфигурации
     */
    public async syncTenant(
        configId: number,
        syncType: SyncType,
        tenantId: number,
        triggeredBy?: number | null,
    ): Promise<ISyncResult> {
        const startTime = Date.now();

        this.logger.log({
            configId,
            syncType,
            tenantId,
            triggeredBy,
            message: 'Начало синхронизации для конфигурации',
        });

        // Получаем конфигурацию с проверкой tenant isolation
        const config = await this.externalRoleSyncRepository.findConfigById(
            configId,
            tenantId,
        );

        if (!config) {
            throw new NotFoundException(
                `Конфигурация с ID ${configId} не найдена или недоступна для тенанта ${tenantId}`,
            );
        }

        // Проверяем статус конфигурации
        if (config.status !== 'ACTIVE') {
            throw new BadRequestException(
                `Конфигурация ${config.name} неактивна (статус: ${config.status})`,
            );
        }

        // Проверяем, не запущена ли уже синхронизация (защита от параллельных запусков)
        const runningLogs = await this.externalRoleSyncRepository.findSyncLogs({
            configId,
            tenantId,
            status: 'RUNNING',
            limit: 1,
        });

        if (runningLogs.length > 0) {
            throw new BadRequestException(
                `Синхронизация для конфигурации ${config.name} уже выполняется`,
            );
        }

        // Проверяем, поддерживает ли провайдер batch синхронизацию
        if (!this.providerFactory.supportsBatchSync(config.providerType)) {
            throw new BadRequestException(
                `Провайдер ${config.providerType} не поддерживает batch синхронизацию. ` +
                    `SSO провайдеры работают через just-in-time provisioning при входе.`,
            );
        }

        // Получаем провайдер
        const provider = this.providerFactory.getProvider(config.providerType);

        if (!provider) {
            throw new BadRequestException(
                `Провайдер ${config.providerType} не найден`,
            );
        }

        // Определяем trigger type
        // Для ON_DEMAND - MANUAL, для FULL/INCREMENTAL - SCHEDULED (если triggeredBy null) или MANUAL
        const triggerType =
            syncType === 'ON_DEMAND'
                ? 'MANUAL'
                : triggeredBy === null
                  ? 'SCHEDULED'
                  : 'MANUAL';

        // Выполняем синхронизацию через LDAPRoleSyncService
        const syncLog = await this.ldapRoleSyncService.syncUsers(
            config,
            provider,
            syncType === 'FULL' ? 'FULL' : 'INCREMENTAL',
            triggerType,
            triggeredBy ?? null,
        );

        // Формируем результат
        const durationMs = Date.now() - startTime;

        const result: ISyncResult = {
            success:
                syncLog.status === 'SUCCESS' || syncLog.status === 'PARTIAL',
            syncLogId: syncLog.id,
            status: syncLog.status,
            statistics: {
                totalUsers: syncLog.totalUsers,
                createdUsers: syncLog.createdUsers,
                updatedUsers: syncLog.updatedUsers,
                deletedUsers: syncLog.deletedUsers,
                mappedUsers: syncLog.mappedUsers,
                skippedUsers: syncLog.skippedUsers,
                failedUsers: syncLog.failedUsers,
            },
            durationMs,
        };

        // Добавляем ошибки, если есть
        if (syncLog.errorDetails && syncLog.errorDetails.length > 0) {
            result.errors = syncLog.errorDetails.map((detail) => ({
                userId: detail.userId?.toString(),
                externalUserId: detail.externalUserId,
                error: detail.error,
                timestamp: detail.timestamp,
            }));
        }

        this.logger.log({
            configId,
            syncLogId: syncLog.id,
            status: result.status,
            durationMs: result.durationMs,
            statistics: result.statistics,
            message: 'Синхронизация завершена',
        });

        // Записываем метрики синхронизации
        // syncType не может быть 'SSO_LOGIN' здесь, т.к. SSO провайдеры не поддерживают batch синхронизацию
        this.metricsCollector.recordSyncOperation(
            config.providerType,
            syncType as 'FULL' | 'INCREMENTAL' | 'ON_DEMAND',
            triggerType,
            result.durationMs,
            result.success,
            {
                totalUsers: result.statistics.totalUsers,
                createdUsers: result.statistics.createdUsers,
                updatedUsers: result.statistics.updatedUsers,
                mappedUsers: result.statistics.mappedUsers,
                failedUsers: result.statistics.failedUsers,
            },
            configId,
            tenantId,
        );

        // Создаем audit log для синхронизации
        if (this.auditService) {
            try {
                await this.auditService.createLog({
                    entityType: 'external_role_sync',
                    entityId: syncLog.id,
                    action: AuditAction.UPDATE,
                    userId: triggeredBy ?? null,
                    oldValues: {
                        status: 'RUNNING',
                        startedAt: new Date(startTime).toISOString(),
                    },
                    newValues: {
                        status: result.status,
                        completedAt: new Date().toISOString(),
                        durationMs: result.durationMs,
                        statistics: result.statistics,
                        syncType,
                        triggerType,
                    },
                    ipAddress: null,
                    userAgent: null,
                    requestId: null,
                    tenantId,
                });
            } catch (error) {
                // Не прерываем выполнение из-за ошибки audit логирования
                this.logger.warn(
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    'Ошибка при создании audit log для синхронизации',
                );
            }
        }

        return result;
    }

    /**
     * Синхронизировать всех пользователей для всех активных конфигураций
     */
    public async syncAllTenants(): Promise<ISyncResult[]> {
        this.logger.log({
            message: 'Начало синхронизации всех активных конфигураций',
        });

        // Получаем все активные конфигурации с включенной синхронизацией
        const configs = await this.externalRoleSyncRepository.findConfigs({
            status: 'ACTIVE',
            syncEnabled: true,
        });

        this.logger.log({
            configsCount: configs.length,
            message: `Найдено ${configs.length} активных конфигураций для синхронизации`,
        });

        // Синхронизируем каждую конфигурацию
        const results: ISyncResult[] = [];

        for (const config of configs) {
            try {
                // Пропускаем SSO провайдеры (они не поддерживают batch синхронизацию)
                if (
                    !this.providerFactory.supportsBatchSync(config.providerType)
                ) {
                    this.logger.debug({
                        configId: config.id,
                        providerType: config.providerType,
                        message:
                            'Пропущен SSO провайдер (не поддерживает batch синхронизацию)',
                    });
                    continue;
                }

                // Используем режим синхронизации из конфигурации
                const syncType = config.syncMode as SyncType;

                const result = await this.syncTenant(
                    config.id,
                    syncType,
                    config.tenantId,
                    null, // Scheduled синхронизация
                );

                results.push(result);
            } catch (error) {
                this.logger.error(
                    {
                        configId: config.id,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    'Ошибка при синхронизации конфигурации',
                );

                // Создаем failed результат для ошибки
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                const failedResult: ISyncResult = {
                    success: false,
                    syncLogId: 0,
                    status: 'FAILED',
                    statistics: {
                        totalUsers: 0,
                        createdUsers: 0,
                        updatedUsers: 0,
                        deletedUsers: 0,
                        mappedUsers: 0,
                        skippedUsers: 0,
                        failedUsers: 0,
                    },
                    errors: [
                        {
                            error: errorMessage,
                            timestamp: new Date(),
                        },
                    ],
                    durationMs: 0,
                };

                // Записываем метрики для failed синхронизации
                // syncMode не может быть 'SSO_LOGIN' для batch синхронизации
                this.metricsCollector.recordSyncOperation(
                    config.providerType,
                    config.syncMode as 'FULL' | 'INCREMENTAL' | 'ON_DEMAND',
                    'SCHEDULED',
                    0,
                    false,
                    {
                        totalUsers: 0,
                        createdUsers: 0,
                        updatedUsers: 0,
                        mappedUsers: 0,
                        failedUsers: 0,
                    },
                    config.id,
                    config.tenantId,
                );

                // Записываем ошибку в метрики
                this.metricsCollector.recordError(
                    'ExternalRoleSyncService',
                    `Sync failed for config ${config.id}: ${errorMessage}`,
                );

                results.push(failedResult);
            }
        }

        this.logger.log({
            totalConfigs: configs.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            message: 'Синхронизация всех конфигураций завершена',
        });

        return results;
    }

    /**
     * Получить статус последней синхронизации
     */
    public async getSyncStatus(
        configId: number,
        tenantId: number,
    ): Promise<ISyncStatus | null> {
        // Получаем конфигурацию с проверкой tenant isolation
        const config = await this.externalRoleSyncRepository.findConfigById(
            configId,
            tenantId,
        );

        if (!config) {
            return null;
        }

        // Получаем последний лог синхронизации
        const logs = await this.externalRoleSyncRepository.findSyncLogs({
            configId,
            tenantId,
            limit: 1,
        });

        const lastLog = logs.length > 0 ? logs[0] : null;

        // Вычисляем nextSyncAt на основе syncSchedule
        let nextSyncAt: Date | null = null;

        if (config.syncEnabled && config.syncSchedule) {
            try {
                // Используем CronJob для вычисления следующего времени выполнения
                const cronJob = new CronJob(
                    config.syncSchedule,
                    () => {
                        // Пустая функция, нам нужен только парсинг
                    },
                    null, // onComplete
                    false, // start сразу
                    'Europe/Moscow', // timezone
                );

                // Получаем следующее время выполнения
                // nextDates() возвращает массив Luxon DateTime объектов
                const nextDates = cronJob.nextDates(1);
                if (nextDates && nextDates.length > 0) {
                    // Luxon DateTime имеет метод toJSDate() для конвертации в JavaScript Date
                    const nextDate = nextDates[0];
                    // Проверяем наличие метода toJSDate (Luxon DateTime)
                    if (
                        nextDate &&
                        typeof (nextDate as { toJSDate?: () => Date })
                            .toJSDate === 'function'
                    ) {
                        nextSyncAt = (
                            nextDate as { toJSDate: () => Date }
                        ).toJSDate();
                    } else if (nextDate instanceof Date) {
                        nextSyncAt = nextDate;
                    } else {
                        // Fallback: используем значение как timestamp
                        nextSyncAt = new Date(
                            (nextDate as { valueOf: () => number }).valueOf(),
                        );
                    }
                }
            } catch (error) {
                // Если cron выражение невалидно, логируем и возвращаем null
                this.logger.warn(
                    {
                        configId: config.id,
                        syncSchedule: config.syncSchedule,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    'Ошибка при вычислении nextSyncAt из cron выражения',
                );
                nextSyncAt = null;
            }
        }

        const status: ISyncStatus = {
            configId: config.id,
            isRunning: lastLog?.status === 'RUNNING' || false,
            lastSyncAt: config.lastSyncAt,
            nextSyncAt,
            lastStatus: lastLog?.status ?? null,
            errorCount: config.errorCount,
            lastError: config.lastError,
            lastErrorAt: config.lastErrorAt,
        };

        return status;
    }

    /**
     * Повторить failed синхронизацию с экспоненциальной задержкой
     */
    public async retryFailedSync(
        configId: number,
        tenantId: number,
        options?: {
            maxRetries?: number;
            initialDelayMs?: number;
            maxDelayMs?: number;
            backoffMultiplier?: number;
        },
    ): Promise<ISyncResult> {
        const maxRetries = options?.maxRetries ?? 3;
        const initialDelayMs = options?.initialDelayMs ?? 1000;
        const maxDelayMs = options?.maxDelayMs ?? 30000;
        const backoffMultiplier = options?.backoffMultiplier ?? 2;

        this.logger.log({
            configId,
            tenantId,
            maxRetries,
            initialDelayMs,
            maxDelayMs,
            backoffMultiplier,
            message: 'Начало retry failed синхронизации',
        });

        // Получаем конфигурацию
        const config = await this.externalRoleSyncRepository.findConfigById(
            configId,
            tenantId,
        );

        if (!config) {
            throw new NotFoundException(
                `Конфигурация с ID ${configId} не найдена или недоступна для тенанта ${tenantId}`,
            );
        }

        // Получаем последний failed лог
        const logs = await this.externalRoleSyncRepository.findSyncLogs({
            configId,
            tenantId,
            status: 'FAILED',
            limit: 1,
        });

        if (logs.length === 0) {
            throw new BadRequestException(
                `Не найдено failed синхронизаций для конфигурации ${configId}`,
            );
        }

        const lastFailedLog = logs[0];
        let lastError: Error | null = null;

        // Retry с экспоненциальной задержкой
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.log({
                    configId,
                    attempt,
                    maxRetries,
                    message: `Попытка retry синхронизации ${attempt}/${maxRetries}`,
                });

                const result = await this.syncTenant(
                    configId,
                    lastFailedLog.syncType,
                    tenantId,
                    null,
                );

                if (result.success) {
                    this.logger.log({
                        configId,
                        attempt,
                        message: 'Retry синхронизации успешен',
                    });

                    // Создаем audit log для успешного retry
                    if (this.auditService) {
                        try {
                            await this.auditService.createLog({
                                entityType: 'external_role_sync',
                                entityId: result.syncLogId,
                                action: AuditAction.UPDATE,
                                userId: null,
                                oldValues: {
                                    status: 'FAILED',
                                    retryAttempt: attempt - 1,
                                },
                                newValues: {
                                    status: result.status,
                                    retryAttempt: attempt,
                                    success: true,
                                },
                                ipAddress: null,
                                userAgent: null,
                                requestId: null,
                                tenantId,
                            });
                        } catch (error) {
                            this.logger.warn(
                                {
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : String(error),
                                },
                                'Ошибка при создании audit log для retry',
                            );
                        }
                    }

                    return result;
                }

                // Если синхронизация завершилась с ошибками, но не упала
                // считаем это частичным успехом и возвращаем результат
                if (attempt === maxRetries) {
                    this.logger.warn({
                        configId,
                        attempt,
                        status: result.status,
                        message:
                            'Retry синхронизации завершен с частичным успехом',
                    });
                    return result;
                }

                // Продолжаем retry
                lastError = new Error(
                    `Синхронизация завершилась со статусом ${result.status}`,
                );
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                this.logger.warn(
                    {
                        configId,
                        attempt,
                        maxRetries,
                        error: lastError.message,
                    },
                    `Ошибка при retry синхронизации (попытка ${attempt}/${maxRetries})`,
                );

                // Если это последняя попытка - выбрасываем ошибку
                if (attempt === maxRetries) {
                    this.logger.error(
                        {
                            configId,
                            maxRetries,
                            error: lastError.message,
                        },
                        'Retry синхронизации исчерпан, все попытки неудачны',
                    );
                    throw lastError;
                }

                // Вычисляем задержку с экспоненциальным backoff
                const delay = Math.min(
                    initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
                    maxDelayMs,
                );

                this.logger.debug({
                    configId,
                    attempt,
                    delay,
                    message: `Ожидание перед следующей попыткой retry`,
                });

                // Ждем перед следующей попыткой
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        // Этот код не должен выполниться, но TypeScript требует возврата
        throw (
            lastError ?? new Error('Неизвестная ошибка при retry синхронизации')
        );
    }

    /**
     * Приостановить автоматическую синхронизацию
     */
    public async pauseSync(configId: number, tenantId: number): Promise<void> {
        const config = await this.externalRoleSyncRepository.findConfigById(
            configId,
            tenantId,
        );

        if (!config) {
            throw new NotFoundException(
                `Конфигурация с ID ${configId} не найдена или недоступна для тенанта ${tenantId}`,
            );
        }

        await this.externalRoleSyncRepository.updateConfig(configId, {
            syncEnabled: false,
        });

        this.logger.log({
            configId,
            tenantId,
            message: 'Автоматическая синхронизация приостановлена',
        });

        // Создаем audit log для приостановки синхронизации
        if (this.auditService) {
            try {
                await this.auditService.createLog({
                    entityType: 'external_role_config',
                    entityId: configId,
                    action: AuditAction.UPDATE,
                    userId: null,
                    oldValues: {
                        syncEnabled: true,
                    },
                    newValues: {
                        syncEnabled: false,
                        action: 'pause_sync',
                    },
                    ipAddress: null,
                    userAgent: null,
                    requestId: null,
                    tenantId,
                });
            } catch (error) {
                this.logger.warn(
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    'Ошибка при создании audit log для pauseSync',
                );
            }
        }
    }

    /**
     * Возобновить автоматическую синхронизацию
     */
    public async resumeSync(configId: number, tenantId: number): Promise<void> {
        const config = await this.externalRoleSyncRepository.findConfigById(
            configId,
            tenantId,
        );

        if (!config) {
            throw new NotFoundException(
                `Конфигурация с ID ${configId} не найдена или недоступна для тенанта ${tenantId}`,
            );
        }

        await this.externalRoleSyncRepository.updateConfig(configId, {
            syncEnabled: true,
        });

        this.logger.log({
            configId,
            tenantId,
            message: 'Автоматическая синхронизация возобновлена',
        });

        // Создаем audit log для возобновления синхронизации
        if (this.auditService) {
            try {
                await this.auditService.createLog({
                    entityType: 'external_role_config',
                    entityId: configId,
                    action: AuditAction.UPDATE,
                    userId: null,
                    oldValues: {
                        syncEnabled: false,
                    },
                    newValues: {
                        syncEnabled: true,
                        action: 'resume_sync',
                    },
                    ipAddress: null,
                    userAgent: null,
                    requestId: null,
                    tenantId,
                });
            } catch (error) {
                this.logger.warn(
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    'Ошибка при создании audit log для resumeSync',
                );
            }
        }
    }

    /**
     * Тестировать подключение к внешней системе
     */
    public async testConnection(
        configId: number,
        tenantId: number,
    ): Promise<{
        success: boolean;
        error?: string;
        providerInfo?: {
            name: string;
            version?: string;
            capabilities?: string[];
        };
    }> {
        // Получаем конфигурацию
        const config = await this.externalRoleSyncRepository.findConfigById(
            configId,
            tenantId,
        );

        if (!config) {
            throw new NotFoundException(
                `Конфигурация с ID ${configId} не найдена или недоступна для тенанта ${tenantId}`,
            );
        }

        // Получаем провайдер
        const provider = this.providerFactory.getProvider(config.providerType);

        if (!provider) {
            return {
                success: false,
                error: `Провайдер ${config.providerType} не поддерживает тестирование подключения`,
            };
        }

        try {
            // Тестируем подключение
            const result = await provider.testConnection(config.providerConfig);

            return {
                success: result.success,
                error: result.error,
                providerInfo: result.providerInfo,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
