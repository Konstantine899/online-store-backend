/**
 * Integration тесты для LDAPProvider
 * Используют mock LDAP сервер для тестирования реального взаимодействия
 *
 * Related to: SAAS-017-19, Этап 2
 */

// Устанавливаем переменные окружения для тестов ДО импорта модулей
process.env.NODE_ENV = 'test';

import type { IProviderConfig } from '@app/domain/models';
import { Test, type TestingModule } from '@nestjs/testing';
import { TestDatabaseSetup } from '@tests/utils';
import { LDAPClientService } from '../ldap-client.service';
import { LDAPProvider } from '../ldap-provider';
import { MockLDAPServer } from './mock-ldap-server';

describe('LDAPProvider (integration)', () => {
    let provider: LDAPProvider;
    let mockServer: MockLDAPServer;
    let serverPort: number;

    const getTestConfig = (port: number): IProviderConfig => ({
        host: 'localhost',
        port,
        baseDN: 'dc=test,dc=com',
        bindDN: 'cn=admin,dc=test,dc=com',
        bindCredentials: 'password123',
        searchBase: 'ou=users,dc=test,dc=com',
        searchFilter: '(objectClass=user)',
        timeout: 5000,
    });

    beforeAll(async () => {
        // Применяем миграции и seeds для тестовой БД
        // Это необходимо для создания таблиц ExternalRoleConfig, RoleMapping и других
        await TestDatabaseSetup.setupDatabase('test');

        // Создаем и запускаем mock LDAP сервер
        mockServer = new MockLDAPServer({
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

        await mockServer.start();
        serverPort = mockServer.getPort();

        const module: TestingModule = await Test.createTestingModule({
            providers: [LDAPClientService, LDAPProvider],
        }).compile();

        provider = module.get<LDAPProvider>(LDAPProvider);
    }, 30000);

    afterAll(async () => {
        if (mockServer) {
            await mockServer.stop();
        }
    }, 10000);

    describe('testConnection', () => {
        it('должен успешно подключиться к mock LDAP серверу', async () => {
            const config = getTestConfig(serverPort);

            const result = await provider.testConnection(config);

            expect(result.success).toBe(true);
            expect(result.providerInfo?.name).toBe('LDAP');
        }, 10000);

        it('должен вернуть ошибку при неправильном порте', async () => {
            const config = getTestConfig(9999); // Несуществующий порт

            const result = await provider.testConnection(config);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        }, 10000);
    });

    describe('searchUsers', () => {
        it('должен найти пользователей в mock LDAP сервере', async () => {
            const config = getTestConfig(serverPort);

            const result = await provider.searchUsers(config, { limit: 10 });

            expect(result.users.length).toBeGreaterThan(0);
            expect(result.totalCount).toBeGreaterThan(0);
            expect(result.users[0].email).toBeDefined();
        }, 10000);

        it('должен поддерживать пагинацию', async () => {
            const config = getTestConfig(serverPort);

            const result1 = await provider.searchUsers(config, {
                limit: 1,
                offset: 0,
            });
            const result2 = await provider.searchUsers(config, {
                limit: 1,
                offset: 1,
            });

            expect(result1.users.length).toBe(1);
            expect(result2.users.length).toBe(1);
            expect(result1.users[0].email).not.toBe(result2.users[0].email);
        }, 15000);
    });

    describe('getUserByEmail', () => {
        it('должен найти пользователя по email', async () => {
            const config = getTestConfig(serverPort);

            const user = await provider.getUserByEmail(
                config,
                'john.doe@test.com',
            );

            expect(user).not.toBeNull();
            expect(user?.email).toBe('john.doe@test.com');
            expect(user?.firstName).toBe('John');
            expect(user?.lastName).toBe('Doe');
        }, 10000);

        it('должен вернуть null для несуществующего email', async () => {
            const config = getTestConfig(serverPort);

            const user = await provider.getUserByEmail(
                config,
                'nonexistent@test.com',
            );

            expect(user).toBeNull();
        }, 10000);
    });

    describe('getUserRoles', () => {
        it('должен вернуть роли пользователя', async () => {
            const config = getTestConfig(serverPort);

            const roles = await provider.getUserRoles(
                config,
                'cn=John Doe,ou=users,dc=test,dc=com',
            );

            expect(roles.length).toBeGreaterThan(0);
            expect(roles).toContain('Admins');
            expect(roles).toContain('Users');
        }, 10000);
    });

    describe('validateConfig', () => {
        it('должен валидировать правильную конфигурацию', async () => {
            const config = getTestConfig(serverPort);

            const result = await provider.validateConfig(config);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('должен вернуть ошибки для невалидной конфигурации', async () => {
            const invalidConfig = {
                host: undefined,
                port: undefined,
            } as IProviderConfig;

            const result = await provider.validateConfig(invalidConfig);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});
