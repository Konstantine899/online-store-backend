import { ExternalRoleConfigModel } from '@app/domain/models';
import { IExternalRoleSyncRepository } from '@app/domain/repositories';
import { IExternalRoleSyncService } from '@app/domain/services/role/i-external-role-sync.service';
import {
    Inject,
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

/**
 * ExternalRoleSyncScheduler
 *
 * Сервис для управления динамическими cron jobs синхронизации внешних систем.
 * Создает, обновляет и удаляет cron jobs на основе конфигураций из БД.
 *
 * Функциональность:
 * - Инициализация всех активных конфигураций при старте приложения
 * - Динамическое добавление cron jobs при создании конфигураций
 * - Обновление cron jobs при изменении расписания
 * - Удаление cron jobs при деактивации или удалении конфигураций
 * - Предотвращение параллельных запусков одной конфигурации
 */
@Injectable()
export class ExternalRoleSyncScheduler
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(ExternalRoleSyncScheduler.name);
    private readonly activeJobs = new Map<number, CronJob>();

    constructor(
        @Inject('IExternalRoleSyncRepository')
        private readonly externalRoleSyncRepository: IExternalRoleSyncRepository,
        @Inject('IExternalRoleSyncService')
        private readonly externalRoleSyncService: IExternalRoleSyncService,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {}

    /**
     * Инициализация при старте модуля
     * Загружает все активные конфигурации и создает cron jobs
     */
    async onModuleInit(): Promise<void> {
        this.logger.log({
            message: 'Инициализация ExternalRoleSyncScheduler',
        });

        try {
            await this.initializeScheduledSyncs();
        } catch (error) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                },
                'Ошибка при инициализации scheduled синхронизаций',
            );
        }
    }

    /**
     * Очистка при остановке модуля
     * Удаляет все активные cron jobs
     */
    onModuleDestroy(): void {
        this.logger.log({
            message:
                'Остановка ExternalRoleSyncScheduler, удаление всех cron jobs',
        });

        for (const [configId, job] of this.activeJobs.entries()) {
            try {
                job.stop();
                this.schedulerRegistry.deleteCronJob(this.getJobName(configId));
                this.logger.debug({
                    configId,
                    message: 'Cron job удален',
                });
            } catch (error) {
                this.logger.error(
                    {
                        configId,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    'Ошибка при удалении cron job',
                );
            }
        }

        this.activeJobs.clear();
    }

    /**
     * Инициализировать все scheduled синхронизации
     * Загружает активные конфигурации и создает cron jobs
     */
    async initializeScheduledSyncs(): Promise<void> {
        this.logger.log({
            message:
                'Загрузка активных конфигураций для scheduled синхронизации',
        });

        // Получаем все активные конфигурации с включенной синхронизацией
        const configs = await this.externalRoleSyncRepository.findConfigs({
            status: 'ACTIVE',
            syncEnabled: true,
        });

        this.logger.log({
            configsCount: configs.length,
            message: `Найдено ${configs.length} активных конфигураций для scheduled синхронизации`,
        });

        // Создаем cron jobs для каждой конфигурации
        for (const config of configs) {
            try {
                await this.addSyncJob(config);
            } catch (error) {
                this.logger.error(
                    {
                        configId: config.id,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    'Ошибка при создании cron job для конфигурации',
                );
            }
        }

        this.logger.log({
            activeJobs: this.activeJobs.size,
            message: `Инициализация завершена, создано ${this.activeJobs.size} cron jobs`,
        });
    }

    /**
     * Добавить cron job для конфигурации
     */
    async addSyncJob(config: ExternalRoleConfigModel): Promise<void> {
        // Проверяем, что конфигурация активна и синхронизация включена
        if (config.status !== 'ACTIVE' || !config.syncEnabled) {
            this.logger.debug({
                configId: config.id,
                status: config.status,
                syncEnabled: config.syncEnabled,
                message:
                    'Конфигурация неактивна или синхронизация отключена, пропускаем',
            });
            return;
        }

        // Проверяем, что job еще не существует
        if (this.activeJobs.has(config.id)) {
            this.logger.warn({
                configId: config.id,
                message: 'Cron job уже существует, обновляем',
            });
            await this.updateSyncJob(config);
            return;
        }

        // Валидируем cron выражение
        if (!this.isValidCronExpression(config.syncSchedule)) {
            this.logger.error({
                configId: config.id,
                syncSchedule: config.syncSchedule,
                message: 'Невалидное cron выражение, пропускаем создание job',
            });
            return;
        }

        const jobName = this.getJobName(config.id);

        // Создаем cron job с обработкой ошибок
        let job: CronJob;
        try {
            job = new CronJob(
                config.syncSchedule,
                async () => {
                    await this.executeScheduledSync(config);
                },
                null, // onComplete
                false, // start сразу
                'Europe/Moscow', // timezone
            );
        } catch (error) {
            this.logger.error(
                {
                    configId: config.id,
                    syncSchedule: config.syncSchedule,
                    error:
                        error instanceof Error ? error.message : String(error),
                },
                'Ошибка при создании cron job, пропускаем',
            );
            return;
        }

        // Регистрируем job в SchedulerRegistry
        this.schedulerRegistry.addCronJob(jobName, job);

        // Сохраняем job в Map
        this.activeJobs.set(config.id, job);

        // Запускаем job
        job.start();

        this.logger.log({
            configId: config.id,
            syncSchedule: config.syncSchedule,
            jobName,
            message: 'Cron job создан и запущен',
        });
    }

    /**
     * Обновить cron job для конфигурации
     */
    async updateSyncJob(config: ExternalRoleConfigModel): Promise<void> {
        const existingJob = this.activeJobs.get(config.id);

        if (!existingJob) {
            // Job не существует, создаем новый
            await this.addSyncJob(config);
            return;
        }

        // Если конфигурация стала неактивной - удаляем job
        if (config.status !== 'ACTIVE' || !config.syncEnabled) {
            await this.removeSyncJob(config.id);
            return;
        }

        // Проверяем, изменилось ли расписание
        const currentSchedule = existingJob.cronTime.source;
        if (currentSchedule === config.syncSchedule) {
            this.logger.debug({
                configId: config.id,
                message: 'Расписание не изменилось, обновление не требуется',
            });
            return;
        }

        // Валидируем новое cron выражение
        if (!this.isValidCronExpression(config.syncSchedule)) {
            this.logger.error({
                configId: config.id,
                syncSchedule: config.syncSchedule,
                message:
                    'Невалидное cron выражение, оставляем старое расписание',
            });
            return;
        }

        // Удаляем старый job
        await this.removeSyncJob(config.id);

        // Создаем новый job с новым расписанием
        await this.addSyncJob(config);

        this.logger.log({
            configId: config.id,
            oldSchedule: currentSchedule,
            newSchedule: config.syncSchedule,
            message: 'Cron job обновлен',
        });
    }

    /**
     * Удалить cron job для конфигурации
     */
    async removeSyncJob(configId: number): Promise<void> {
        const job = this.activeJobs.get(configId);

        if (!job) {
            this.logger.debug({
                configId,
                message: 'Cron job не найден, удаление не требуется',
            });
            return;
        }

        try {
            // Останавливаем job
            job.stop();

            // Удаляем из SchedulerRegistry
            const jobName = this.getJobName(configId);
            this.schedulerRegistry.deleteCronJob(jobName);

            // Удаляем из Map
            this.activeJobs.delete(configId);

            this.logger.log({
                configId,
                message: 'Cron job удален',
            });
        } catch (error) {
            this.logger.error(
                {
                    configId,
                    error:
                        error instanceof Error ? error.message : String(error),
                },
                'Ошибка при удалении cron job',
            );
        }
    }

    /**
     * Выполнить scheduled синхронизацию
     * @private
     */
    private async executeScheduledSync(
        config: ExternalRoleConfigModel,
    ): Promise<void> {
        const startTime = Date.now();

        this.logger.log({
            configId: config.id,
            tenantId: config.tenantId,
            syncSchedule: config.syncSchedule,
            message: 'Начало scheduled синхронизации',
        });

        try {
            // Используем режим синхронизации из конфигурации
            const syncType = config.syncMode as 'FULL' | 'INCREMENTAL';

            const result = await this.externalRoleSyncService.syncTenant(
                config.id,
                syncType,
                config.tenantId,
                null, // Scheduled синхронизация
            );

            const duration = Date.now() - startTime;

            this.logger.log({
                configId: config.id,
                syncLogId: result.syncLogId,
                status: result.status,
                duration,
                statistics: result.statistics,
                message: 'Scheduled синхронизация завершена',
            });
        } catch (error) {
            const duration = Date.now() - startTime;

            this.logger.error(
                {
                    configId: config.id,
                    tenantId: config.tenantId,
                    duration,
                    error:
                        error instanceof Error ? error.message : String(error),
                },
                'Ошибка при scheduled синхронизации',
            );
        }
    }

    /**
     * Получить имя cron job для конфигурации
     * @private
     */
    private getJobName(configId: number): string {
        return `external-role-sync-${configId}`;
    }

    /**
     * Валидация cron выражения
     * @private
     */
    private isValidCronExpression(cronExpression: string): boolean {
        if (!cronExpression || typeof cronExpression !== 'string') {
            return false;
        }

        // Базовая валидация формата cron (5 или 6 полей)
        const cronFields = cronExpression.trim().split(/\s+/);
        return cronFields.length === 5 || cronFields.length === 6;
    }

    /**
     * Получить статистику активных jobs
     */
    getActiveJobsCount(): number {
        return this.activeJobs.size;
    }

    /**
     * Получить список активных config IDs
     */
    getActiveConfigIds(): number[] {
        return Array.from(this.activeJobs.keys());
    }
}
