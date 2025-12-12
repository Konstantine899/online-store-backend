/**
 * Unit тесты для ExternalRoleSyncScheduler
 * Покрывают управление динамическими cron jobs синхронизации
 *
 * Related to: SAAS-017-19, Этап 5
 */

import type { ExternalRoleConfigModel } from '@app/domain/models';
import type { IExternalRoleSyncRepository } from '@app/domain/repositories';
import type {
    IExternalRoleSyncService,
    ISyncResult,
} from '@app/domain/services/role/i-external-role-sync.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, type TestingModule } from '@nestjs/testing';
import type { CronJob } from 'cron';
import { ExternalRoleSyncScheduler } from '../external-role-sync-scheduler.service';

describe('ExternalRoleSyncScheduler (unit)', () => {
    let scheduler: ExternalRoleSyncScheduler;
    let externalRoleSyncRepository: jest.Mocked<IExternalRoleSyncRepository>;
    let externalRoleSyncService: jest.Mocked<IExternalRoleSyncService>;
    let schedulerRegistry: jest.Mocked<SchedulerRegistry>;

    const mockConfig: ExternalRoleConfigModel = {
        id: 1,
        tenantId: 1,
        providerType: 'LDAP',
        name: 'Test LDAP',
        description: 'Test configuration',
        providerConfig: {
            host: 'ldap.test.com',
            port: 389,
            baseDN: 'dc=test,dc=com',
            bindDN: 'cn=admin,dc=test,dc=com',
            bindCredentials: 'password123',
            searchBase: 'ou=users,dc=test,dc=com',
            searchFilter: '(objectClass=user)',
        },
        syncEnabled: true,
        syncSchedule: '0 */6 * * *',
        syncMode: 'INCREMENTAL',
        lastSyncAt: null,
        nextSyncAt: null,
        credentialsEncrypted: true,
        verifySSL: true,
        timeoutMs: 30000,
        status: 'ACTIVE',
        lastError: null,
        lastErrorAt: null,
        errorCount: 0,
        createdBy: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as ExternalRoleConfigModel;

    const mockSyncResult: ISyncResult = {
        success: true,
        syncLogId: 1,
        status: 'SUCCESS',
        statistics: {
            totalUsers: 10,
            createdUsers: 5,
            updatedUsers: 3,
            deletedUsers: 0,
            mappedUsers: 8,
            skippedUsers: 2,
            failedUsers: 0,
        },
        durationMs: 1000,
    };

    beforeEach(async () => {
        externalRoleSyncRepository = {
            findConfigs: jest.fn().mockResolvedValue([]), // Мокируем до создания модуля, чтобы onModuleInit не зависал
        } as unknown as jest.Mocked<IExternalRoleSyncRepository>;

        externalRoleSyncService = {
            syncTenant: jest.fn(),
        } as unknown as jest.Mocked<IExternalRoleSyncService>;

        schedulerRegistry = {
            addCronJob: jest.fn(),
            deleteCronJob: jest.fn(),
            getCronJob: jest.fn(),
        } as unknown as jest.Mocked<SchedulerRegistry>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExternalRoleSyncScheduler,
                {
                    provide: 'IExternalRoleSyncRepository',
                    useValue: externalRoleSyncRepository,
                },
                {
                    provide: 'IExternalRoleSyncService',
                    useValue: externalRoleSyncService,
                },
                {
                    provide: SchedulerRegistry,
                    useValue: schedulerRegistry,
                },
            ],
        }).compile();

        scheduler = module.get<ExternalRoleSyncScheduler>(
            ExternalRoleSyncScheduler,
        );

        // Ждем завершения onModuleInit, если он еще выполняется
        await new Promise((resolve) => setImmediate(resolve));
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Очищаем активные jobs
        scheduler.onModuleDestroy();
    });

    describe('onModuleInit', () => {
        it('должен инициализировать scheduled синхронизации при старте', async () => {
            const configs = [mockConfig];
            externalRoleSyncRepository.findConfigs.mockResolvedValue(configs);
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            await scheduler.onModuleInit();

            expect(externalRoleSyncRepository.findConfigs).toHaveBeenCalledWith(
                {
                    status: 'ACTIVE',
                    syncEnabled: true,
                },
            );
        });

        it('должен обработать ошибки при инициализации', async () => {
            externalRoleSyncRepository.findConfigs.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(scheduler.onModuleInit()).resolves.not.toThrow();
        });
    });

    describe('onModuleDestroy', () => {
        it('должен удалить все активные cron jobs при остановке', () => {
            // Создаем mock job
            const mockJob = {
                stop: jest.fn(),
                cronTime: { source: '0 */6 * * *' },
            } as unknown as CronJob;

            // Добавляем job вручную через приватное поле (для теста)
            // Используем unknown для типобезопасного доступа к приватному полю
            (
                scheduler as unknown as { activeJobs: Map<number, CronJob> }
            ).activeJobs.set(1, mockJob);

            scheduler.onModuleDestroy();

            expect(mockJob.stop).toHaveBeenCalled();
            expect(schedulerRegistry.deleteCronJob).toHaveBeenCalled();
        });
    });

    describe('initializeScheduledSyncs', () => {
        it('должен создать cron jobs для всех активных конфигураций', async () => {
            const configs = [mockConfig];
            externalRoleSyncRepository.findConfigs.mockResolvedValue(configs);
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            await scheduler.initializeScheduledSyncs();

            expect(externalRoleSyncRepository.findConfigs).toHaveBeenCalledWith(
                {
                    status: 'ACTIVE',
                    syncEnabled: true,
                },
            );
            expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
            expect(scheduler.getActiveJobsCount()).toBe(1);
        });

        it('должен обработать ошибки при создании отдельных jobs', async () => {
            const configs = [mockConfig];
            externalRoleSyncRepository.findConfigs.mockResolvedValue(configs);
            // Мокаем ошибку при создании job
            // Используем unknown для типобезопасного доступа к методу
            jest.spyOn(
                scheduler as unknown as { addSyncJob: () => Promise<void> },
                'addSyncJob',
            ).mockRejectedValue(new Error('Job creation error'));

            await expect(
                scheduler.initializeScheduledSyncs(),
            ).resolves.not.toThrow();
        });
    });

    describe('addSyncJob', () => {
        it('должен создать и запустить cron job для конфигурации', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            await scheduler.addSyncJob(mockConfig);

            expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
            expect(scheduler.getActiveJobsCount()).toBe(1);
            expect(scheduler.getActiveConfigIds()).toContain(1);
        });

        it('должен пропустить неактивную конфигурацию', async () => {
            const inactiveConfig = {
                ...mockConfig,
                status: 'INACTIVE' as const,
            } as unknown as ExternalRoleConfigModel;

            await scheduler.addSyncJob(inactiveConfig);

            expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
            expect(scheduler.getActiveJobsCount()).toBe(0);
        });

        it('должен пропустить конфигурацию с отключенной синхронизацией', async () => {
            const disabledConfig = {
                ...mockConfig,
                syncEnabled: false,
            } as unknown as ExternalRoleConfigModel;

            await scheduler.addSyncJob(disabledConfig);

            expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
            expect(scheduler.getActiveJobsCount()).toBe(0);
        });

        it('должен обновить существующий job если он уже есть', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            // Добавляем первый раз
            await scheduler.addSyncJob(mockConfig);
            expect(scheduler.getActiveJobsCount()).toBe(1);

            // Добавляем второй раз (должен обновиться)
            await scheduler.addSyncJob(mockConfig);
            expect(scheduler.getActiveJobsCount()).toBe(1);
        });

        it('должен пропустить конфигурацию с невалидным cron выражением', async () => {
            const invalidCronConfig = {
                ...mockConfig,
                syncSchedule: 'invalid cron',
            } as unknown as ExternalRoleConfigModel;

            await scheduler.addSyncJob(invalidCronConfig);

            expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
            expect(scheduler.getActiveJobsCount()).toBe(0);
        });
    });

    describe('updateSyncJob', () => {
        it('должен обновить существующий cron job', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            // Создаем job
            await scheduler.addSyncJob(mockConfig);

            // Обновляем с новым расписанием
            const updatedConfig = {
                ...mockConfig,
                syncSchedule: '0 */12 * * *',
            } as unknown as ExternalRoleConfigModel;
            await scheduler.updateSyncJob(updatedConfig);

            expect(scheduler.getActiveJobsCount()).toBe(1);
        });

        it('должен создать новый job если его не существует', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            await scheduler.updateSyncJob(mockConfig);

            expect(scheduler.getActiveJobsCount()).toBe(1);
        });

        it('должен удалить job если конфигурация стала неактивной', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            // Создаем job
            await scheduler.addSyncJob(mockConfig);
            expect(scheduler.getActiveJobsCount()).toBe(1);

            // Деактивируем конфигурацию
            const inactiveConfig = {
                ...mockConfig,
                status: 'INACTIVE' as const,
            } as unknown as ExternalRoleConfigModel;
            await scheduler.updateSyncJob(inactiveConfig);

            expect(scheduler.getActiveJobsCount()).toBe(0);
        });

        it('должен оставить старое расписание если новое невалидно', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            // Создаем job
            await scheduler.addSyncJob(mockConfig);

            // Пытаемся обновить с невалидным cron
            const invalidCronConfig = {
                ...mockConfig,
                syncSchedule: 'invalid cron',
            } as unknown as ExternalRoleConfigModel;
            await scheduler.updateSyncJob(invalidCronConfig);

            // Job должен остаться
            expect(scheduler.getActiveJobsCount()).toBe(1);
        });
    });

    describe('removeSyncJob', () => {
        it('должен удалить cron job для конфигурации', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            // Создаем job
            await scheduler.addSyncJob(mockConfig);
            expect(scheduler.getActiveJobsCount()).toBe(1);

            // Удаляем job
            await scheduler.removeSyncJob(1);

            expect(scheduler.getActiveJobsCount()).toBe(0);
            expect(schedulerRegistry.deleteCronJob).toHaveBeenCalled();
        });

        it('должен корректно обработать удаление несуществующего job', async () => {
            await scheduler.removeSyncJob(999);

            expect(scheduler.getActiveJobsCount()).toBe(0);
        });
    });

    describe('executeScheduledSync', () => {
        it('должен выполнить scheduled синхронизацию', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            // Используем приватный метод через type assertion для тестирования
            await (
                scheduler as unknown as {
                    executeScheduledSync: (
                        config: ExternalRoleConfigModel,
                    ) => Promise<void>;
                }
            ).executeScheduledSync(mockConfig);

            expect(externalRoleSyncService.syncTenant).toHaveBeenCalledWith(
                1,
                'INCREMENTAL',
                1,
                null,
            );
        });

        it('должен обработать ошибки при выполнении синхронизации', async () => {
            externalRoleSyncService.syncTenant.mockRejectedValue(
                new Error('Sync error'),
            );

            await expect(
                (
                    scheduler as unknown as {
                        executeScheduledSync: (
                            config: ExternalRoleConfigModel,
                        ) => Promise<void>;
                    }
                ).executeScheduledSync(mockConfig),
            ).resolves.not.toThrow();
        });
    });

    describe('getActiveJobsCount', () => {
        it('должен вернуть количество активных jobs', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            expect(scheduler.getActiveJobsCount()).toBe(0);

            await scheduler.addSyncJob(mockConfig);

            expect(scheduler.getActiveJobsCount()).toBe(1);
        });
    });

    describe('getActiveConfigIds', () => {
        it('должен вернуть список ID активных конфигураций', async () => {
            externalRoleSyncService.syncTenant.mockResolvedValue(
                mockSyncResult,
            );

            expect(scheduler.getActiveConfigIds()).toEqual([]);

            await scheduler.addSyncJob(mockConfig);

            expect(scheduler.getActiveConfigIds()).toEqual([1]);
        });
    });

    describe('isValidCronExpression', () => {
        it('должен валидировать корректные cron выражения', async () => {
            const validExpressions = [
                '0 */6 * * *',
                '0 0 * * *',
                '*/5 * * * *',
                '0 0 1 * *',
                '0 0 0 1 *',
            ];

            for (const expr of validExpressions) {
                const config = {
                    ...mockConfig,
                    syncSchedule: expr,
                } as unknown as ExternalRoleConfigModel;
                await expect(
                    scheduler.addSyncJob(config),
                ).resolves.not.toThrow();
            }
        });

        it('должен отклонять невалидные cron выражения', async () => {
            const invalidExpressions = [
                '',
                'invalid',
                '1',
                '1 2',
                '1 2 3 4 5 6 7',
            ];

            for (const expr of invalidExpressions) {
                const config = {
                    ...mockConfig,
                    syncSchedule: expr,
                } as unknown as ExternalRoleConfigModel;
                await scheduler.addSyncJob(config);
                expect(scheduler.getActiveJobsCount()).toBe(0);
            }
        });
    });
});
