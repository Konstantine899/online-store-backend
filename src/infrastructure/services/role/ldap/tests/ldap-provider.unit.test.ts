/**
 * Unit тесты для LDAPProvider
 * Покрывают реализацию IExternalRoleProvider для LDAP/AD
 *
 * Related to: SAAS-017-19, Этап 2
 */

import type { IProviderConfig } from '@app/domain/models';
import type { IExternalUser } from '@app/domain/services/role/i-external-role-provider';
import { Test, type TestingModule } from '@nestjs/testing';
import type * as ldap from 'ldapjs';
import { LDAPClientService } from '../ldap-client.service';
import { LDAPProvider } from '../ldap-provider';

describe('LDAPProvider (unit)', () => {
    let provider: LDAPProvider;
    let ldapClientService: jest.Mocked<LDAPClientService>;
    let mockClient: jest.Mocked<ldap.Client>;

    const mockConfig: IProviderConfig = {
        host: 'ldap.test.com',
        port: 389,
        baseDN: 'dc=test,dc=com',
        bindDN: 'cn=admin,dc=test,dc=com',
        bindCredentials: 'password123',
        searchBase: 'ou=users,dc=test,dc=com',
        searchFilter: '(objectClass=user)',
        timeout: 30000,
    };

    const mockExternalUser: IExternalUser = {
        externalId: 'cn=user1,ou=users,dc=test,dc=com',
        email: 'user1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        phone: '+1234567890',
        externalRoles: ['Admins', 'Users'],
        attributes: {
            dn: 'cn=user1,ou=users,dc=test,dc=com',
        },
    };

    beforeEach(async () => {
        mockClient = {
            bind: jest.fn(
                (
                    dn: string,
                    password: string,
                    callback: (err: Error | null) => void,
                ) => {
                    callback(null);
                },
            ),
            search: jest.fn(),
            unbind: jest.fn((callback: (err: Error | null) => void) => {
                callback(null);
            }),
            on: jest.fn(),
        } as unknown as jest.Mocked<ldap.Client>;

        ldapClientService = {
            createClient: jest.fn().mockResolvedValue(mockClient),
            bind: jest.fn().mockResolvedValue(undefined),
            search: jest.fn(),
            extractUserAttributes: jest.fn().mockReturnValue(mockExternalUser),
            disconnect: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<LDAPClientService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LDAPProvider,
                {
                    provide: LDAPClientService,
                    useValue: ldapClientService,
                },
            ],
        }).compile();

        provider = module.get<LDAPProvider>(LDAPProvider);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getProviderType', () => {
        it('должен вернуть тип провайдера LDAP', () => {
            expect(provider.getProviderType()).toBe('LDAP');
        });
    });

    describe('testConnection', () => {
        it('должен успешно проверить подключение', async () => {
            ldapClientService.search = jest.fn().mockResolvedValue([]);

            const result = await provider.testConnection(mockConfig);

            expect(result.success).toBe(true);
            expect(result.providerInfo?.name).toBe('LDAP');
            expect(ldapClientService.createClient).toHaveBeenCalled();
            expect(ldapClientService.bind).toHaveBeenCalledWith(
                expect.any(Object), // client
                mockConfig.bindDN,
                mockConfig.bindCredentials,
            );
        });

        it('должен вернуть ошибку при невалидной конфигурации', async () => {
            const invalidConfig = { ...mockConfig, host: undefined };

            const result = await provider.testConnection(
                invalidConfig as IProviderConfig,
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Невалидная конфигурация');
        });

        it('должен вернуть ошибку при ошибке подключения', async () => {
            const error = new Error('Connection failed');
            ldapClientService.createClient = jest.fn().mockRejectedValue(error);

            const result = await provider.testConnection(mockConfig);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Connection failed');
        });

        it('должен закрыть подключение после проверки', async () => {
            ldapClientService.search = jest.fn().mockResolvedValue([]);

            await provider.testConnection(mockConfig);

            expect(ldapClientService.disconnect).toHaveBeenCalledWith(
                mockClient,
            );
        });
    });

    describe('validateConfig', () => {
        it('должен валидировать правильную конфигурацию', async () => {
            const result = await provider.validateConfig(mockConfig);

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
            expect(result.errors).toContain('host обязателен');
            expect(result.errors).toContain('port обязателен');
        });

        it('должен проверить диапазон port', async () => {
            const invalidConfig = {
                ...mockConfig,
                port: 70000, // Невалидный порт
            };

            const result = await provider.validateConfig(invalidConfig);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'port должен быть в диапазоне 1-65535',
            );
        });

        it('должен проверить что bindDN и bindCredentials указаны вместе', async () => {
            const invalidConfig = {
                ...mockConfig,
                bindDN: 'cn=admin',
                bindCredentials: undefined,
            };

            const result = await provider.validateConfig(invalidConfig);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'bindDN и bindCredentials должны быть указаны вместе',
            );
        });
    });

    describe('searchUsers', () => {
        it('должен найти пользователей', async () => {
            const mockEntries: ldap.SearchEntry[] = [
                {
                    dn: 'cn=user1,ou=users,dc=test,dc=com',
                    attributes: [],
                } as unknown as ldap.SearchEntry,
            ];

            ldapClientService.search = jest.fn().mockResolvedValue(mockEntries);

            const result = await provider.searchUsers(mockConfig, {
                limit: 10,
            });

            expect(result.users).toHaveLength(1);
            expect(result.totalCount).toBe(1);
            expect(ldapClientService.search).toHaveBeenCalled();
        });

        it('должен поддерживать пагинацию', async () => {
            const mockEntries: ldap.SearchEntry[] = Array(10)
                .fill(null)
                .map((_, i) => ({
                    dn: `cn=user${i},ou=users,dc=test,dc=com`,
                    attributes: [],
                })) as unknown as ldap.SearchEntry[];

            ldapClientService.search = jest.fn().mockResolvedValue(mockEntries);

            await provider.searchUsers(mockConfig, {
                limit: 10,
                offset: 5,
            });

            expect(ldapClientService.search).toHaveBeenCalledWith(
                expect.any(Object), // client
                expect.any(String),
                expect.any(String),
                expect.objectContaining({
                    limit: 10,
                    offset: 5,
                }),
            );
        });

        it('должен поддерживать инкрементальную синхронизацию', async () => {
            const modifiedSince = new Date('2024-01-01');
            ldapClientService.search = jest.fn().mockResolvedValue([]);

            await provider.searchUsers(mockConfig, { modifiedSince });

            expect(ldapClientService.search).toHaveBeenCalledWith(
                expect.any(Object), // client
                expect.any(String),
                expect.stringContaining('whenChanged>='),
                expect.any(Object),
            );
        });

        it('должен обработать ошибку при поиске', async () => {
            const error = new Error('Search failed');
            ldapClientService.search = jest.fn().mockRejectedValue(error);

            await expect(provider.searchUsers(mockConfig)).rejects.toThrow(
                'Search failed',
            );
        });
    });

    describe('getUserById', () => {
        it('должен получить пользователя по ID (DN)', async () => {
            const mockEntry: ldap.SearchEntry = {
                dn: 'cn=user1,ou=users,dc=test,dc=com',
                attributes: [],
            } as unknown as ldap.SearchEntry;

            ldapClientService.search = jest.fn().mockResolvedValue([mockEntry]);

            const result = await provider.getUserById(
                mockConfig,
                'cn=user1,ou=users,dc=test,dc=com',
            );

            expect(result).not.toBeNull();
            expect(result?.externalId).toBe('cn=user1,ou=users,dc=test,dc=com');
            expect(ldapClientService.search).toHaveBeenCalledWith(
                expect.any(Object), // client
                'cn=user1,ou=users,dc=test,dc=com',
                '(objectClass=*)',
                expect.objectContaining({
                    scope: 'base',
                    limit: 1,
                }),
            );
        });

        it('должен вернуть null если пользователь не найден', async () => {
            ldapClientService.search = jest.fn().mockResolvedValue([]);

            const result = await provider.getUserById(
                mockConfig,
                'cn=nonexistent,dc=test,dc=com',
            );

            expect(result).toBeNull();
        });
    });

    describe('getUserByEmail', () => {
        it('должен найти пользователя по email', async () => {
            const mockEntry: ldap.SearchEntry = {
                dn: 'cn=user1,ou=users,dc=test,dc=com',
                attributes: [],
            } as unknown as ldap.SearchEntry;

            ldapClientService.search = jest.fn().mockResolvedValue([mockEntry]);

            const result = await provider.getUserByEmail(
                mockConfig,
                'user1@test.com',
            );

            expect(result).not.toBeNull();
            expect(ldapClientService.search).toHaveBeenCalledWith(
                expect.any(Object), // client
                expect.any(String),
                expect.stringContaining('user1@test.com'),
                expect.any(Object),
            );
        });

        it('должен вернуть null если пользователь не найден', async () => {
            ldapClientService.search = jest.fn().mockResolvedValue([]);

            const result = await provider.getUserByEmail(
                mockConfig,
                'nonexistent@test.com',
            );

            expect(result).toBeNull();
        });
    });

    describe('getUserRoles', () => {
        it('должен вернуть роли пользователя', async () => {
            const userWithRoles: IExternalUser = {
                ...mockExternalUser,
                externalRoles: ['Admins', 'Managers'],
            };

            ldapClientService.search = jest.fn().mockResolvedValue([
                {
                    dn: 'cn=user1',
                    attributes: [],
                } as unknown as ldap.SearchEntry,
            ]);
            ldapClientService.extractUserAttributes = jest
                .fn()
                .mockReturnValue(userWithRoles);

            const roles = await provider.getUserRoles(
                mockConfig,
                'cn=user1,ou=users,dc=test,dc=com',
            );

            expect(roles).toEqual(['Admins', 'Managers']);
        });

        it('должен вернуть пустой массив если пользователь не найден', async () => {
            ldapClientService.search = jest.fn().mockResolvedValue([]);

            const roles = await provider.getUserRoles(
                mockConfig,
                'cn=nonexistent,dc=test,dc=com',
            );

            expect(roles).toEqual([]);
        });
    });
});
