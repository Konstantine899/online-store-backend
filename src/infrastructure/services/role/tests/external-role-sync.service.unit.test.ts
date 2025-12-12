/**
 * Unit тесты для ExternalRoleSyncService
 * Покрывают главный сервис синхронизации внешних систем управления ролями
 *
 * Related to: SAAS-017-19, Этап 5
 */

import type {
    AuditLogModel,
    ExternalRoleConfigModel,
    ExternalUserSyncLogModel,
} from '@app/domain/models';
import type { IExternalRoleSyncRepository } from '@app/domain/repositories';
import type { IExternalRoleProvider } from '@app/domain/services/role/i-external-role-provider';
import { TenantContext } from '@app/infrastructure/common/context';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { AuditService } from '@app/infrastructure/services/audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ExternalRoleProviderFactory } from '../external-role-provider.factory';
import { ExternalRoleSyncService } from '../external-role-sync.service';
import { LDAPRoleSyncService } from '../ldap/ldap-role-sync.service';

describe('ExternalRoleSyncService (unit)', () => {
    let service: ExternalRoleSyncService;
    let externalRoleSyncRepository: jest.Mocked<IExternalRoleSyncRepository>;
    let providerFactory: jest.Mocked<ExternalRoleProviderFactory>;
    let ldapRoleSyncService: jest.Mocked<LDAPRoleSyncService>;
    let tenantContext: jest.Mocked<TenantContext>;
    let metricsCollector: jest.Mocked<MetricsCollector>;
    let auditService: jest.Mocked<AuditService>;
    let provider: jest.Mocked<IExternalRoleProvider>;

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

    const mockSyncLog = {
        id: 1,
        externalRoleConfigId: 1,
        tenantId: 1,
        syncType: 'INCREMENTAL',
        triggerType: 'MANUAL',
        triggeredBy: null,
        status: 'SUCCESS',
        totalUsers: 10,
        createdUsers: 5,
        updatedUsers: 3,
        deletedUsers: 0,
        mappedUsers: 8,
        skippedUsers: 2,
        failedUsers: 0,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1000,
        errorMessage: null,
        errorDetails: [],
        metadata: null,
    } as unknown as ExternalUserSyncLogModel;

    const mockAuditLog = {
        id: 1,
        entityType: 'external_role_sync',
        entityId: 1,
        action: 'SYNC',
        userId: null,
        tenantId: 1,
        oldValues: null,
        newValues: null,
        ipAddress: null,
        userAgent: null,
        requestId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as unknown as AuditLogModel;

    beforeEach(async () => {
        provider = {
            getProviderType: jest.fn().mockReturnValue('LDAP'),
            testConnection: jest.fn(),
        } as unknown as jest.Mocked<IExternalRoleProvider>;

        externalRoleSyncRepository = {
            findConfigById: jest.fn(),
            findConfigs: jest.fn(),
            findSyncLogs: jest.fn(),
            updateConfig: jest.fn(),
        } as unknown as jest.Mocked<IExternalRoleSyncRepository>;

        providerFactory = {
            getProvider: jest.fn(),
            supportsBatchSync: jest.fn(),
            isSSOProvider: jest.fn(),
        } as unknown as jest.Mocked<ExternalRoleProviderFactory>;

        ldapRoleSyncService = {
            syncUsers: jest.fn(),
        } as unknown as jest.Mocked<LDAPRoleSyncService>;

        tenantContext = {
            getTenantIdOrNull: jest.fn().mockReturnValue(1),
            getTenantId: jest.fn().mockReturnValue(1),
        } as unknown as jest.Mocked<TenantContext>;

        metricsCollector = {
            recordSyncOperation: jest.fn(),
            recordError: jest.fn(),
        } as unknown as jest.Mocked<MetricsCollector>;

        auditService = {
            createLog: jest.fn(),
        } as unknown as jest.Mocked<AuditService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExternalRoleSyncService,
                {
                    provide: 'IExternalRoleSyncRepository',
                    useValue: externalRoleSyncRepository,
                },
                {
                    provide: ExternalRoleProviderFactory,
                    useValue: providerFactory,
                },
                {
                    provide: LDAPRoleSyncService,
                    useValue: ldapRoleSyncService,
                },
                {
                    provide: TenantContext,
                    useValue: tenantContext,
                },
                {
                    provide: MetricsCollector,
                    useValue: metricsCollector,
                },
                {
                    provide: AuditService,
                    useValue: auditService,
                },
            ],
        }).compile();

        service = module.get<ExternalRoleSyncService>(ExternalRoleSyncService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('syncTenant', () => {
        it('должен успешно синхронизировать пользователей для конфигурации', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            const result = await service.syncTenant(1, 'INCREMENTAL', 1, null);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.syncLogId).toBe(1);
            expect(result.status).toBe('SUCCESS');
            expect(
                externalRoleSyncRepository.findConfigById,
            ).toHaveBeenCalledWith(1, 1);
            expect(ldapRoleSyncService.syncUsers).toHaveBeenCalled();
            expect(metricsCollector.recordSyncOperation).toHaveBeenCalled();
            expect(auditService.createLog).toHaveBeenCalled();
        });

        it('должен выбросить NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(
                service.syncTenant(999, 'FULL', 1, null),
            ).rejects.toThrow(NotFoundException);
        });

        it('должен выбросить BadRequestException если конфигурация неактивна', async () => {
            const inactiveConfig = {
                ...mockConfig,
                status: 'INACTIVE' as const,
            } as unknown as ExternalRoleConfigModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                inactiveConfig,
            );

            await expect(
                service.syncTenant(1, 'FULL', 1, null),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен выбросить BadRequestException если синхронизация уже выполняется', async () => {
            const runningLog = {
                ...mockSyncLog,
                status: 'RUNNING' as const,
            } as unknown as ExternalUserSyncLogModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([
                runningLog,
            ]);

            await expect(
                service.syncTenant(1, 'FULL', 1, null),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен выбросить BadRequestException для SSO провайдеров', async () => {
            const ssoConfig = {
                ...mockConfig,
                providerType: 'AZURE_AD' as const,
            } as unknown as ExternalRoleConfigModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                ssoConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(false);

            await expect(
                service.syncTenant(1, 'FULL', 1, null),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен выбросить BadRequestException если провайдер не найден', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(null);

            await expect(
                service.syncTenant(1, 'FULL', 1, null),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен правильно определять triggerType для ON_DEMAND', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            await service.syncTenant(1, 'ON_DEMAND', 1, null);

            expect(ldapRoleSyncService.syncUsers).toHaveBeenCalledWith(
                mockConfig,
                provider,
                'INCREMENTAL',
                'MANUAL',
                null,
            );
        });

        it('должен правильно определять triggerType для SCHEDULED', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            await service.syncTenant(1, 'FULL', 1, null);

            expect(ldapRoleSyncService.syncUsers).toHaveBeenCalledWith(
                mockConfig,
                provider,
                'FULL',
                'SCHEDULED',
                null,
            );
        });

        it('должен правильно определять triggerType для MANUAL', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            await service.syncTenant(1, 'FULL', 1, 123);

            expect(ldapRoleSyncService.syncUsers).toHaveBeenCalledWith(
                mockConfig,
                provider,
                'FULL',
                'MANUAL',
                123,
            );
        });

        it('должен обрабатывать ошибки audit логирования без прерывания', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockRejectedValue(new Error('Audit error'));

            const result = await service.syncTenant(1, 'INCREMENTAL', 1, null);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });
    });

    describe('syncAllTenants', () => {
        it('должен синхронизировать все активные конфигурации', async () => {
            const configs = [mockConfig];
            externalRoleSyncRepository.findConfigs.mockResolvedValue(configs);
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            const results = await service.syncAllTenants();

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(externalRoleSyncRepository.findConfigs).toHaveBeenCalledWith(
                {
                    status: 'ACTIVE',
                    syncEnabled: true,
                },
            );
        });

        it('должен пропускать SSO провайдеры', async () => {
            const ssoConfig = {
                ...mockConfig,
                providerType: 'AZURE_AD' as const,
            } as unknown as ExternalRoleConfigModel;
            const configs = [mockConfig, ssoConfig];
            externalRoleSyncRepository.findConfigs.mockResolvedValue(configs);
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockImplementation(
                (type) => type === 'LDAP',
            );
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            const results = await service.syncAllTenants();

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
        });

        it('должен обрабатывать ошибки синхронизации отдельных конфигураций', async () => {
            const configs = [mockConfig];
            externalRoleSyncRepository.findConfigs.mockResolvedValue(configs);
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockRejectedValue(
                new Error('Sync error'),
            );

            const results = await service.syncAllTenants();

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].status).toBe('FAILED');
            expect(metricsCollector.recordSyncOperation).toHaveBeenCalled();
        });
    });

    describe('getSyncStatus', () => {
        it('должен вернуть статус синхронизации', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([
                mockSyncLog,
            ]);

            const status = await service.getSyncStatus(1, 1);

            expect(status).toBeDefined();
            expect(status?.configId).toBe(1);
            expect(status?.isRunning).toBe(false);
            expect(status?.lastStatus).toBe('SUCCESS');
        });

        it('должен вернуть null если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            const status = await service.getSyncStatus(999, 1);

            expect(status).toBeNull();
        });

        it('должен вычислить nextSyncAt из cron выражения', async () => {
            const configWithSchedule = {
                ...mockConfig,
                syncEnabled: true,
                syncSchedule: '0 */6 * * *',
            } as unknown as ExternalRoleConfigModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                configWithSchedule,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);

            const status = await service.getSyncStatus(1, 1);

            expect(status).toBeDefined();
            expect(status?.nextSyncAt).toBeInstanceOf(Date);
        });

        it('должен вернуть null для nextSyncAt если синхронизация отключена', async () => {
            const configDisabled = {
                ...mockConfig,
                syncEnabled: false,
            } as unknown as ExternalRoleConfigModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                configDisabled,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);

            const status = await service.getSyncStatus(1, 1);

            expect(status).toBeDefined();
            expect(status?.nextSyncAt).toBeNull();
        });

        it('должен обработать невалидное cron выражение', async () => {
            const configInvalidCron = {
                ...mockConfig,
                syncEnabled: true,
                syncSchedule: 'invalid cron',
            } as unknown as ExternalRoleConfigModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                configInvalidCron,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);

            const status = await service.getSyncStatus(1, 1);

            expect(status).toBeDefined();
            expect(status?.nextSyncAt).toBeNull();
        });
    });

    describe('retryFailedSync', () => {
        it('должен успешно повторить failed синхронизацию', async () => {
            const failedLog = {
                ...mockSyncLog,
                status: 'FAILED' as const,
            } as unknown as ExternalUserSyncLogModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([
                failedLog,
            ]);
            externalRoleSyncRepository.findSyncLogs
                .mockResolvedValueOnce([failedLog])
                .mockResolvedValueOnce([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            const result = await service.retryFailedSync(1, 1);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(
                externalRoleSyncRepository.findSyncLogs,
            ).toHaveBeenCalledWith({
                configId: 1,
                tenantId: 1,
                status: 'FAILED',
                limit: 1,
            });
        });

        it('должен выбросить NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(service.retryFailedSync(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('должен выбросить BadRequestException если нет failed синхронизаций', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);

            await expect(service.retryFailedSync(1, 1)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('должен использовать экспоненциальный backoff при ошибках', async () => {
            const failedLog = {
                ...mockSyncLog,
                status: 'FAILED' as const,
            } as unknown as ExternalUserSyncLogModel;
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.findSyncLogs
                .mockResolvedValueOnce([failedLog])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);
            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers
                .mockRejectedValueOnce(new Error('First attempt failed'))
                .mockResolvedValueOnce(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            // Используем реальные таймеры, но с минимальными задержками для теста
            const result = await service.retryFailedSync(1, 1, {
                maxRetries: 3,
                initialDelayMs: 10, // Минимальная задержка для быстрого теста
                maxDelayMs: 100,
                backoffMultiplier: 2,
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(ldapRoleSyncService.syncUsers).toHaveBeenCalledTimes(2);
        }, 10000);
    });

    describe('pauseSync', () => {
        it('должен приостановить автоматическую синхронизацию', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.updateConfig.mockResolvedValue(
                mockConfig,
            );
            auditService.createLog.mockResolvedValue(mockAuditLog);

            await service.pauseSync(1, 1);

            expect(
                externalRoleSyncRepository.updateConfig,
            ).toHaveBeenCalledWith(1, {
                syncEnabled: false,
            });
            expect(auditService.createLog).toHaveBeenCalled();
        });

        it('должен выбросить NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(service.pauseSync(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('resumeSync', () => {
        it('должен возобновить автоматическую синхронизацию', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            externalRoleSyncRepository.updateConfig.mockResolvedValue(
                mockConfig,
            );
            auditService.createLog.mockResolvedValue(mockAuditLog);

            await service.resumeSync(1, 1);

            expect(
                externalRoleSyncRepository.updateConfig,
            ).toHaveBeenCalledWith(1, {
                syncEnabled: true,
            });
            expect(auditService.createLog).toHaveBeenCalled();
        });

        it('должен выбросить NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(service.resumeSync(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('testConnection', () => {
        it('должен успешно протестировать подключение', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            providerFactory.getProvider.mockReturnValue(provider);
            provider.testConnection.mockResolvedValue({
                success: true,
                providerInfo: {
                    name: 'LDAP',
                    version: '1.0',
                    capabilities: ['search', 'bind'],
                },
            });

            const result = await service.testConnection(1, 1);

            expect(result.success).toBe(true);
            expect(result.providerInfo?.name).toBe('LDAP');
            expect(provider.testConnection).toHaveBeenCalledWith(
                mockConfig.providerConfig,
            );
        });

        it('должен выбросить NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(service.testConnection(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('должен вернуть ошибку если провайдер не поддерживает тестирование', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            providerFactory.getProvider.mockReturnValue(null);

            const result = await service.testConnection(1, 1);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('должен обработать ошибку при тестировании подключения', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );
            providerFactory.getProvider.mockReturnValue(provider);
            provider.testConnection.mockRejectedValue(
                new Error('Connection failed'),
            );

            const result = await service.testConnection(1, 1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Connection failed');
        });
    });

    describe('Race conditions', () => {
        it('должен предотвращать параллельные запуски одной конфигурации', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(
                mockConfig,
            );

            // Первый вызов - нет RUNNING, второй - уже есть RUNNING
            const runningLog = {
                ...mockSyncLog,
                status: 'RUNNING' as const,
            } as unknown as ExternalUserSyncLogModel;

            externalRoleSyncRepository.findSyncLogs
                .mockResolvedValueOnce([]) // Первый вызов - нет RUNNING
                .mockResolvedValueOnce([runningLog]); // Второй вызов - уже есть RUNNING

            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers.mockResolvedValue(mockSyncLog);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            // Запускаем два параллельных вызова
            const promise1 = service.syncTenant(1, 'FULL', 1);
            const promise2 = service.syncTenant(1, 'FULL', 1);

            const [result1, result2] = await Promise.allSettled([
                promise1,
                promise2,
            ]);

            // Один должен быть успешным
            expect(result1.status).toBe('fulfilled');
            if (result1.status === 'fulfilled') {
                expect(result1.value.success).toBe(true);
            }

            // Второй вызов должен быть заблокирован (BadRequestException)
            expect(result2.status).toBe('rejected');
            if (result2.status === 'rejected') {
                expect(result2.reason).toBeInstanceOf(BadRequestException);
            }
        });

        it('должен корректно обрабатывать параллельные вызовы разных конфигураций', async () => {
            const config1 = {
                ...mockConfig,
                id: 1,
            } as unknown as ExternalRoleConfigModel;
            const config2 = {
                ...mockConfig,
                id: 2,
            } as unknown as ExternalRoleConfigModel;

            externalRoleSyncRepository.findConfigById
                .mockResolvedValueOnce(config1)
                .mockResolvedValueOnce(config2);
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);

            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);
            ldapRoleSyncService.syncUsers
                .mockResolvedValueOnce({
                    ...mockSyncLog,
                    id: 1,
                } as unknown as ExternalUserSyncLogModel)
                .mockResolvedValueOnce({
                    ...mockSyncLog,
                    id: 2,
                } as unknown as ExternalUserSyncLogModel);
            auditService.createLog.mockResolvedValue(mockAuditLog);

            // Запускаем параллельные вызовы для разных конфигураций
            const [result1, result2] = await Promise.all([
                service.syncTenant(1, 'FULL', 1),
                service.syncTenant(2, 'FULL', 1),
            ]);

            // Оба должны быть успешными
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result1.syncLogId).toBe(1);
            expect(result2.syncLogId).toBe(2);
        });

        it('должен корректно обрабатывать параллельные вызовы syncAllTenants', async () => {
            const config1 = {
                ...mockConfig,
                id: 1,
            } as unknown as ExternalRoleConfigModel;
            const config2 = {
                ...mockConfig,
                id: 2,
            } as unknown as ExternalRoleConfigModel;

            // Мокаем findConfigs для обоих вызовов
            externalRoleSyncRepository.findConfigs
                .mockResolvedValueOnce([config1, config2])
                .mockResolvedValueOnce([config1, config2]);

            // Мокаем findConfigById для каждого syncTenant вызова (4 раза: 2 конфига × 2 вызова)
            externalRoleSyncRepository.findConfigById
                .mockResolvedValueOnce(config1)
                .mockResolvedValueOnce(config2)
                .mockResolvedValueOnce(config1)
                .mockResolvedValueOnce(config2);

            // Мокаем findSyncLogs для каждого syncTenant вызова (4 раза)
            externalRoleSyncRepository.findSyncLogs.mockResolvedValue([]);

            providerFactory.supportsBatchSync.mockReturnValue(true);
            providerFactory.getProvider.mockReturnValue(provider);

            // Мокаем syncUsers для каждого syncTenant вызова (4 раза)
            const syncLog1 = {
                ...mockSyncLog,
                id: 1,
            } as unknown as ExternalUserSyncLogModel;
            const syncLog2 = {
                ...mockSyncLog,
                id: 2,
            } as unknown as ExternalUserSyncLogModel;

            ldapRoleSyncService.syncUsers
                .mockResolvedValueOnce(syncLog1)
                .mockResolvedValueOnce(syncLog2)
                .mockResolvedValueOnce(syncLog1)
                .mockResolvedValueOnce(syncLog2);

            auditService.createLog.mockResolvedValue(mockAuditLog);

            // Запускаем параллельные вызовы syncAllTenants
            const [results1, results2] = await Promise.all([
                service.syncAllTenants(),
                service.syncAllTenants(),
            ]);

            // Оба должны вернуть результаты
            expect(results1.length).toBe(2);
            expect(results2.length).toBe(2);
            expect(results1.every((r) => r.success)).toBe(true);
            expect(results2.every((r) => r.success)).toBe(true);
        });
    });
});
