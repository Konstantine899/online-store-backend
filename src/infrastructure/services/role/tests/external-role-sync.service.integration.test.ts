/**
 * Integration тесты для ExternalRoleSyncService
 * Используют реальную БД и mock LDAP сервер для тестирования синхронизации
 *
 * Related to: SAAS-017-19, Этап 5
 */

// Устанавливаем переменные окружения для тестов ДО импорта модулей
process.env.NODE_ENV = 'test';

import type { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDatabaseSetup, TestCleanup } from '../../../../../tests/utils';
import {
    ExternalRoleConfigModel,
    ExternalUserSyncLogModel,
    RoleModel,
    RoleMappingModel,
} from '../../../../domain/models';
import { ExternalRoleSyncService } from '../external-role-sync.service';
import { MockLDAPServer } from '../ldap/tests/mock-ldap-server';

describe('ExternalRoleSyncService (integration)', () => {
    let app: INestApplication | null = null;
    let isAppInitialized = false;
    let service: ExternalRoleSyncService;
    let sequelize: Sequelize;
    let mockLDAPServer: MockLDAPServer;
    let serverPort: number;
    let testConfig: ExternalRoleConfigModel;
    let testRole: RoleModel;
    let testRoleMapping: RoleMappingModel;

    beforeAll(async () => {
        jest.setTimeout(60000);

        try {
            // Настройка тестовой БД
            await TestDatabaseSetup.setupDatabase('test');

            app = await setupTestApp();
            isAppInitialized = true;
            sequelize = app.get<Sequelize>(Sequelize);

            // Получаем сервис из DI контейнера
            service = app.get<ExternalRoleSyncService>(ExternalRoleSyncService);

            // Создаем mock LDAP сервер
            mockLDAPServer = new MockLDAPServer({
                port: 0, // Автоматический порт
                baseDN: 'dc=test,dc=com',
                users: [
                    {
                        dn: 'cn=John Doe,ou=users,dc=test,dc=com',
                        attributes: {
                            cn: 'John Doe',
                            mail: 'john.doe@test.com',
                            givenName: 'John',
                            sn: 'Doe',
                            displayName: 'John Doe',
                            telephoneNumber: '+1234567890',
                            memberOf: [
                                'CN=Admins,OU=Groups,dc=test,dc=com',
                                'CN=Users,OU=Groups,dc=test,dc=com',
                            ],
                            objectClass: 'user',
                        },
                    },
                    {
                        dn: 'cn=Jane Smith,ou=users,dc=test,dc=com',
                        attributes: {
                            cn: 'Jane Smith',
                            mail: 'jane.smith@test.com',
                            givenName: 'Jane',
                            sn: 'Smith',
                            displayName: 'Jane Smith',
                            telephoneNumber: '+0987654321',
                            memberOf: ['CN=Users,OU=Groups,dc=test,dc=com'],
                            objectClass: 'user',
                        },
                    },
                ],
            });

            await mockLDAPServer.start();
            serverPort = mockLDAPServer.getPort();

            // Создаем тестовую роль
            testRole = await RoleModel.create({
                role: 'TEST_ADMIN',
                description: 'Test admin role',
                level: 100,
                tenantId: 1,
                isSystemRole: false,
                isActive: true,
            });

            // Создаем конфигурацию внешней системы
            testConfig = await ExternalRoleConfigModel.create({
                tenantId: 1,
                providerType: 'LDAP',
                name: 'Test LDAP Configuration',
                description: 'Test configuration for integration tests',
                providerConfig: {
                    host: 'localhost',
                    port: serverPort,
                    baseDN: 'dc=test,dc=com',
                    bindDN: 'cn=admin,dc=test,dc=com',
                    bindCredentials: 'password123',
                    searchBase: 'ou=users,dc=test,dc=com',
                    searchFilter: '(objectClass=user)',
                    timeout: 5000,
                },
                syncEnabled: true,
                syncSchedule: '0 */6 * * *',
                syncMode: 'INCREMENTAL',
                status: 'ACTIVE',
                credentialsEncrypted: false,
            });

            // Создаем маппинг ролей
            testRoleMapping = await RoleMappingModel.create({
                externalRoleConfigId: testConfig.id,
                tenantId: 1,
                externalRoleName: 'Admins',
                internalRoleId: testRole.id,
                priority: 100,
                isActive: true,
            });
        } catch (error) {
            console.error('❌ [beforeAll] Failed to setup test app:', error);
            app = null;
            isAppInitialized = false;
            throw error;
        }
    }, 60000);

    afterAll(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (mockLDAPServer) {
            await mockLDAPServer.stop();
        }

        if (isAppInitialized && app !== null && app !== undefined) {
            try {
                // Очистка тестовых данных
                if (testRoleMapping) {
                    await testRoleMapping.destroy();
                }
                if (testConfig) {
                    await testConfig.destroy();
                }
                if (testRole) {
                    await testRole.destroy();
                }

                await TestCleanup.cleanUsers(sequelize);
                await app.close();
            } catch (error) {
                console.error('❌ [afterAll] Error cleaning up:', error);
            }
        }
    }, 10000);

    describe('syncTenant', () => {
        it('должен успешно синхронизировать пользователей из LDAP', async () => {
            const result = await service.syncTenant(
                testConfig.id,
                'FULL',
                1,
                null,
            );

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.syncLogId).toBeGreaterThan(0);
            expect(result.status).toBe('SUCCESS');
            expect(result.statistics.totalUsers).toBeGreaterThan(0);
            expect(result.statistics.createdUsers).toBeGreaterThan(0);
        }, 30000);

        it('должен выбросить NotFoundException для несуществующей конфигурации', async () => {
            await expect(service.syncTenant(99999, 'FULL', 1, null)).rejects.toThrow(
                'NotFoundException',
            );
        });

        it('должен выбросить BadRequestException для неактивной конфигурации', async () => {
            const inactiveConfig = await ExternalRoleConfigModel.create({
                tenantId: 1,
                providerType: 'LDAP',
                name: 'Inactive Config',
                description: 'Inactive configuration',
                providerConfig: testConfig.providerConfig,
                syncEnabled: true,
                syncSchedule: '0 */6 * * *',
                syncMode: 'INCREMENTAL',
                status: 'INACTIVE',
                credentialsEncrypted: false,
            });

            await expect(
                service.syncTenant(inactiveConfig.id, 'FULL', 1, null),
            ).rejects.toThrow('BadRequestException');

            await inactiveConfig.destroy();
        });

        it('должен предотвратить параллельные запуски синхронизации', async () => {
            // Создаем RUNNING лог вручную
            await ExternalUserSyncLogModel.create({
                externalRoleConfigId: testConfig.id,
                tenantId: 1,
                syncType: 'FULL',
                triggerType: 'MANUAL',
                triggeredBy: null,
                status: 'RUNNING',
                totalUsers: 0,
                createdUsers: 0,
                updatedUsers: 0,
                deletedUsers: 0,
                mappedUsers: 0,
                skippedUsers: 0,
                failedUsers: 0,
                startedAt: new Date(),
                completedAt: null,
                durationMs: 0,
                errorMessage: null,
                errorDetails: [],
                metadata: null,
            });

            await expect(
                service.syncTenant(testConfig.id, 'FULL', 1, null),
            ).rejects.toThrow('BadRequestException');

            // Очищаем RUNNING лог
            await ExternalUserSyncLogModel.destroy({
                where: {
                    externalRoleConfigId: testConfig.id,
                    status: 'RUNNING',
                },
            });
        });
    });

    describe('syncAllTenants', () => {
        it('должен синхронизировать все активные конфигурации', async () => {
            const results = await service.syncAllTenants();

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
        }, 30000);
    });

    describe('getSyncStatus', () => {
        it('должен вернуть статус синхронизации', async () => {
            const status = await service.getSyncStatus(testConfig.id, 1);

            expect(status).toBeDefined();
            expect(status?.configId).toBe(testConfig.id);
            expect(status?.isRunning).toBe(false);
            expect(status?.lastStatus).toBeDefined();
        });

        it('должен вычислить nextSyncAt из cron выражения', async () => {
            const status = await service.getSyncStatus(testConfig.id, 1);

            expect(status).toBeDefined();
            if (testConfig.syncEnabled && testConfig.syncSchedule) {
                expect(status?.nextSyncAt).toBeInstanceOf(Date);
            }
        });

        it('должен вернуть null для несуществующей конфигурации', async () => {
            const status = await service.getSyncStatus(99999, 1);

            expect(status).toBeNull();
        });
    });

    describe('retryFailedSync', () => {
        it('должен повторить failed синхронизацию', async () => {
            // Создаем failed лог
            const failedLog = await ExternalUserSyncLogModel.create({
                externalRoleConfigId: testConfig.id,
                tenantId: 1,
                syncType: 'FULL',
                triggerType: 'MANUAL',
                triggeredBy: null,
                status: 'FAILED',
                totalUsers: 0,
                createdUsers: 0,
                updatedUsers: 0,
                deletedUsers: 0,
                mappedUsers: 0,
                skippedUsers: 0,
                failedUsers: 0,
                startedAt: new Date(),
                completedAt: new Date(),
                durationMs: 1000,
                errorMessage: 'Test error',
                errorDetails: [],
                metadata: null,
            });

            const result = await service.retryFailedSync(testConfig.id, 1, {
                maxRetries: 1,
                initialDelayMs: 100,
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);

            // Очищаем failed лог
            await failedLog.destroy();
        }, 30000);

        it('должен выбросить BadRequestException если нет failed синхронизаций', async () => {
            await expect(service.retryFailedSync(testConfig.id, 1)).rejects.toThrow(
                'BadRequestException',
            );
        });
    });

    describe('pauseSync и resumeSync', () => {
        it('должен приостановить и возобновить синхронизацию', async () => {
            // Приостанавливаем
            await service.pauseSync(testConfig.id, 1);

            const pausedConfig = await ExternalRoleConfigModel.findByPk(testConfig.id);
            expect(pausedConfig?.syncEnabled).toBe(false);

            // Возобновляем
            await service.resumeSync(testConfig.id, 1);

            const resumedConfig = await ExternalRoleConfigModel.findByPk(testConfig.id);
            expect(resumedConfig?.syncEnabled).toBe(true);
        });
    });

    describe('testConnection', () => {
        it('должен успешно протестировать подключение к LDAP', async () => {
            const result = await service.testConnection(testConfig.id, 1);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.providerInfo?.name).toBe('LDAP');
        }, 10000);

        it('должен выбросить NotFoundException для несуществующей конфигурации', async () => {
            await expect(service.testConnection(99999, 1)).rejects.toThrow(
                'NotFoundException',
            );
        });
    });
});


