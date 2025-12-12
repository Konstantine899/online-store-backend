/**
 * Integration тесты для ExternalRoleSyncScheduler
 * Используют реальную БД для тестирования управления cron jobs
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
    RoleModel,
    RoleMappingModel,
} from '../../../../domain/models';
import { ExternalRoleSyncScheduler } from '../external-role-sync-scheduler.service';
import { MockLDAPServer } from '../ldap/tests/mock-ldap-server';

describe('ExternalRoleSyncScheduler (integration)', () => {
    let app: INestApplication | null = null;
    let isAppInitialized = false;
    let scheduler: ExternalRoleSyncScheduler;
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
            scheduler = app.get<ExternalRoleSyncScheduler>(
                ExternalRoleSyncScheduler,
            );

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

    describe('initializeScheduledSyncs', () => {
        it('должен создать cron jobs для всех активных конфигураций', async () => {
            await scheduler.initializeScheduledSyncs();

            const activeJobsCount = scheduler.getActiveJobsCount();
            expect(activeJobsCount).toBeGreaterThan(0);
        });
    });

    describe('addSyncJob', () => {
        it('должен создать и запустить cron job для конфигурации', async () => {
            const initialCount = scheduler.getActiveJobsCount();

            await scheduler.addSyncJob(testConfig);

            const newCount = scheduler.getActiveJobsCount();
            expect(newCount).toBeGreaterThan(initialCount);
            expect(scheduler.getActiveConfigIds()).toContain(testConfig.id);
        });

        it('должен пропустить неактивную конфигурацию', async () => {
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

            const initialCount = scheduler.getActiveJobsCount();

            await scheduler.addSyncJob(inactiveConfig);

            const newCount = scheduler.getActiveJobsCount();
            expect(newCount).toBe(initialCount);

            await inactiveConfig.destroy();
        });

        it('должен пропустить конфигурацию с отключенной синхронизацией', async () => {
            const disabledConfig = await ExternalRoleConfigModel.create({
                tenantId: 1,
                providerType: 'LDAP',
                name: 'Disabled Config',
                description: 'Disabled sync configuration',
                providerConfig: testConfig.providerConfig,
                syncEnabled: false,
                syncSchedule: '0 */6 * * *',
                syncMode: 'INCREMENTAL',
                status: 'ACTIVE',
                credentialsEncrypted: false,
            });

            const initialCount = scheduler.getActiveJobsCount();

            await scheduler.addSyncJob(disabledConfig);

            const newCount = scheduler.getActiveJobsCount();
            expect(newCount).toBe(initialCount);

            await disabledConfig.destroy();
        });
    });

    describe('updateSyncJob', () => {
        it('должен обновить существующий cron job', async () => {
            // Создаем job
            await scheduler.addSyncJob(testConfig);

            // Обновляем с новым расписанием
            const updatedConfig = await ExternalRoleConfigModel.findByPk(testConfig.id);
            if (updatedConfig) {
                updatedConfig.syncSchedule = '0 */12 * * *';
                await updatedConfig.save();

                await scheduler.updateSyncJob(updatedConfig);

                expect(scheduler.getActiveJobsCount()).toBeGreaterThan(0);
            }
        });

        it('должен удалить job если конфигурация стала неактивной', async () => {
            // Создаем job
            await scheduler.addSyncJob(testConfig);

            // Деактивируем конфигурацию
            const config = await ExternalRoleConfigModel.findByPk(testConfig.id);
            if (config) {
                config.status = 'INACTIVE';
                await config.save();

                await scheduler.updateSyncJob(config);

                // Job должен быть удален
                expect(scheduler.getActiveConfigIds()).not.toContain(testConfig.id);
            }

            // Восстанавливаем статус
            const restoredConfig = await ExternalRoleConfigModel.findByPk(testConfig.id);
            if (restoredConfig) {
                restoredConfig.status = 'ACTIVE';
                await restoredConfig.save();
            }
        });
    });

    describe('removeSyncJob', () => {
        it('должен удалить cron job для конфигурации', async () => {
            // Создаем job
            await scheduler.addSyncJob(testConfig);
            expect(scheduler.getActiveConfigIds()).toContain(testConfig.id);

            // Удаляем job
            await scheduler.removeSyncJob(testConfig.id);

            expect(scheduler.getActiveConfigIds()).not.toContain(testConfig.id);
        });

        it('должен корректно обработать удаление несуществующего job', async () => {
            const initialCount = scheduler.getActiveJobsCount();

            await scheduler.removeSyncJob(99999);

            expect(scheduler.getActiveJobsCount()).toBe(initialCount);
        });
    });

    describe('getActiveJobsCount и getActiveConfigIds', () => {
        it('должен вернуть количество активных jobs', () => {
            const count = scheduler.getActiveJobsCount();

            expect(count).toBeGreaterThanOrEqual(0);
            expect(typeof count).toBe('number');
        });

        it('должен вернуть список ID активных конфигураций', () => {
            const configIds = scheduler.getActiveConfigIds();

            expect(Array.isArray(configIds)).toBe(true);
            configIds.forEach((id) => {
                expect(typeof id).toBe('number');
            });
        });
    });

    describe('onModuleDestroy', () => {
        it('должен удалить все активные cron jobs при остановке', () => {
            // Создаем несколько jobs
            scheduler.addSyncJob(testConfig);

            const initialCount = scheduler.getActiveJobsCount();
            expect(initialCount).toBeGreaterThan(0);

            // Вызываем onModuleDestroy
            scheduler.onModuleDestroy();

            // Jobs должны быть удалены
            expect(scheduler.getActiveJobsCount()).toBe(0);
        });
    });
});


