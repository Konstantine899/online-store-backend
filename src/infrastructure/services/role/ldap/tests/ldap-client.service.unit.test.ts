/**
 * Unit тесты для LDAPClientService
 * Покрывают низкоуровневые операции работы с LDAP/AD серверами
 *
 * Related to: SAAS-017-19, Этап 2
 */

import type { IProviderConfig } from '@app/domain/models';
import { Test, type TestingModule } from '@nestjs/testing';
import * as ldap from 'ldapjs';
import { LDAPClientService } from '../ldap-client.service';

// Мокаем ldapjs
jest.mock('ldapjs', () => ({
    createClient: jest.fn(),
}));

describe('LDAPClientService (unit)', () => {
    let service: LDAPClientService;
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

    beforeEach(async () => {
        // Создаем мок клиента
        mockClient = {
            bind: jest
                .fn()
                .mockImplementation(
                    (
                        dn: string,
                        password: string,
                        callback?: (err: Error | null) => void,
                    ) => {
                        if (callback) {
                            callback(null);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['bind'],
            search: jest
                .fn()
                .mockImplementation(
                    (
                        base: string,
                        options: unknown,
                        callback?: (
                            err: Error | null,
                            res: ldap.SearchCallbackResponse | null,
                        ) => void,
                    ) => {
                        if (callback) {
                            callback(null, null);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['search'],
            unbind: jest
                .fn()
                .mockImplementation(
                    (callback?: (err: Error | null) => void) => {
                        if (callback) {
                            callback(null);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['unbind'],
            on: jest.fn(),
        } as unknown as jest.Mocked<ldap.Client>;

        // Настраиваем мок createClient
        (ldap.createClient as jest.Mock).mockReturnValue(mockClient);

        const module: TestingModule = await Test.createTestingModule({
            providers: [LDAPClientService],
        }).compile();

        service = module.get<LDAPClientService>(LDAPClientService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createClient', () => {
        it('должен создать клиент с правильными параметрами', async () => {
            const client = await service.createClient(mockConfig);

            expect(ldap.createClient).toHaveBeenCalledWith({
                url: 'ldap://ldap.test.com:389',
                timeout: 30000,
                connectTimeout: 30000,
            });
            expect(client).toBe(mockClient);
        });

        it('должен создать клиент с TLS опциями', async () => {
            const configWithTLS: IProviderConfig = {
                ...mockConfig,
                tlsOptions: {
                    rejectUnauthorized: true,
                    ca: ['cert1', 'cert2'],
                },
            };

            await service.createClient(configWithTLS);

            expect(ldap.createClient).toHaveBeenCalledWith(
                expect.objectContaining({
                    tlsOptions: expect.objectContaining({
                        rejectUnauthorized: true,
                    }),
                }),
            );
        });

        it('должен выбросить ошибку если host не указан', async () => {
            const invalidConfig = { ...mockConfig, host: undefined };

            await expect(
                service.createClient(invalidConfig as IProviderConfig),
            ).rejects.toThrow('LDAP host и port обязательны для подключения');
        });

        it('должен выбросить ошибку если port не указан', async () => {
            const invalidConfig = { ...mockConfig, port: undefined };

            await expect(
                service.createClient(invalidConfig as IProviderConfig),
            ).rejects.toThrow('LDAP host и port обязательны для подключения');
        });
    });

    describe('bind', () => {
        it('должен успешно выполнить bind', async () => {
            if (!mockConfig.bindDN || !mockConfig.bindCredentials) {
                throw new Error('bindDN and bindCredentials are required');
            }
            await service.bind(
                mockClient,
                mockConfig.bindDN,
                mockConfig.bindCredentials,
            );

            expect(mockClient.bind).toHaveBeenCalledWith(
                mockConfig.bindDN,
                mockConfig.bindCredentials,
                expect.any(Function),
            );
        });

        it('должен выбросить ошибку при неудачном bind', async () => {
            const error = new Error('Invalid credentials');
            mockClient.bind = jest
                .fn()
                .mockImplementation(
                    (
                        dn: string,
                        password: string,
                        callback?: (err: Error | null) => void,
                    ) => {
                        if (callback) {
                            callback(error);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['bind'];

            if (!mockConfig.bindDN || !mockConfig.bindCredentials) {
                throw new Error('bindDN and bindCredentials are required');
            }
            await expect(
                service.bind(
                    mockClient,
                    mockConfig.bindDN,
                    mockConfig.bindCredentials,
                ),
            ).rejects.toThrow('Invalid credentials');
        });
    });

    describe('search', () => {
        it('должен выполнить поиск и вернуть результаты', async () => {
            const mockEntries: ldap.SearchEntry[] = [
                {
                    dn: 'cn=user1,ou=users,dc=test,dc=com',
                    attributes: [
                        {
                            type: 'cn',
                            values: ['User One'],
                        },
                        {
                            type: 'mail',
                            values: ['user1@test.com'],
                        },
                    ],
                } as ldap.SearchEntry,
            ];

            const mockResponse = {
                on: jest.fn(
                    (event: string, handler: (data: unknown) => void) => {
                        if (event === 'searchEntry') {
                            mockEntries.forEach((entry) => handler(entry));
                        }
                        if (event === 'end') {
                            handler(null);
                        }
                        return mockResponse;
                    },
                ),
            } as unknown as ldap.SearchCallbackResponse;

            mockClient.search = jest
                .fn()
                .mockImplementation(
                    (
                        base: string,
                        options: unknown,
                        callback?: (
                            err: Error | null,
                            res: ldap.SearchCallbackResponse | null,
                        ) => void,
                    ) => {
                        if (callback) {
                            callback(null, mockResponse);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['search'];

            if (!mockConfig.searchBase || !mockConfig.searchFilter) {
                throw new Error('searchBase and searchFilter are required');
            }
            const result = await service.search(
                mockClient,
                mockConfig.searchBase,
                mockConfig.searchFilter,
                { limit: 10 },
            );

            expect(mockClient.search).toHaveBeenCalledWith(
                mockConfig.searchBase,
                expect.objectContaining({
                    filter: mockConfig.searchFilter,
                    scope: 'sub',
                    sizeLimit: 10,
                }),
                expect.any(Function),
            );
            expect(result).toHaveLength(1);
            expect(result[0].dn.toString()).toBe(
                'cn=user1,ou=users,dc=test,dc=com',
            );
        });

        it('должен применить offset если указан', async () => {
            const mockEntries: ldap.SearchEntry[] = [
                {
                    dn: 'cn=user1',
                    attributes: [],
                } as unknown as ldap.SearchEntry,
                {
                    dn: 'cn=user2',
                    attributes: [],
                } as unknown as ldap.SearchEntry,
                {
                    dn: 'cn=user3',
                    attributes: [],
                } as unknown as ldap.SearchEntry,
            ];

            const mockResponse = {
                on: jest.fn(
                    (event: string, handler: (data: unknown) => void) => {
                        if (event === 'searchEntry') {
                            mockEntries.forEach((entry) => handler(entry));
                        }
                        if (event === 'end') {
                            handler(null);
                        }
                        return mockResponse;
                    },
                ),
            } as unknown as ldap.SearchCallbackResponse;

            mockClient.search = jest
                .fn()
                .mockImplementation(
                    (
                        base: string,
                        options: unknown,
                        callback?: (
                            err: Error | null,
                            res: ldap.SearchCallbackResponse | null,
                        ) => void,
                    ) => {
                        if (callback) {
                            callback(null, mockResponse);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['search'];

            if (!mockConfig.searchBase || !mockConfig.searchFilter) {
                throw new Error('searchBase and searchFilter are required');
            }
            const result = await service.search(
                mockClient,
                mockConfig.searchBase,
                mockConfig.searchFilter,
                { limit: 10, offset: 1 },
            );

            expect(result).toHaveLength(2); // После offset=1 остается 2 записи
        });

        it('должен выбросить ошибку при ошибке поиска', async () => {
            const error = new Error('Search failed');
            mockClient.search = jest
                .fn()
                .mockImplementation(
                    (
                        base: string,
                        options: unknown,
                        callback?: (
                            err: Error | null,
                            res: ldap.SearchCallbackResponse | null,
                        ) => void,
                    ) => {
                        if (callback) {
                            callback(error, null);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['search'];

            if (!mockConfig.searchBase || !mockConfig.searchFilter) {
                throw new Error('searchBase and searchFilter are required');
            }
            await expect(
                service.search(
                    mockClient,
                    mockConfig.searchBase,
                    mockConfig.searchFilter,
                ),
            ).rejects.toThrow('Search failed');
        });
    });

    describe('extractUserAttributes', () => {
        it('должен извлечь атрибуты пользователя из LDAP записи', () => {
            const entry: ldap.SearchEntry = {
                dn: 'cn=John Doe,ou=users,dc=test,dc=com',
                attributes: [
                    { type: 'mail', values: ['john.doe@test.com'] },
                    { type: 'givenName', values: ['John'] },
                    { type: 'sn', values: ['Doe'] },
                    { type: 'displayName', values: ['John Doe'] },
                    { type: 'telephoneNumber', values: ['+1234567890'] },
                    {
                        type: 'memberOf',
                        values: ['CN=Admins,OU=Groups', 'CN=Users,OU=Groups'],
                    },
                ],
            } as unknown as ldap.SearchEntry;

            const user = service.extractUserAttributes(entry, 'LDAP');

            expect(user.externalId).toBe('cn=John Doe,ou=users,dc=test,dc=com');
            expect(user.email).toBe('john.doe@test.com');
            expect(user.firstName).toBe('John');
            expect(user.lastName).toBe('Doe');
            expect(user.displayName).toBe('John Doe');
            expect(user.phone).toBe('+1234567890');
            expect(user.externalRoles).toEqual(['Admins', 'Users']);
        });

        it('должен извлечь атрибуты для AD провайдера', () => {
            const entry: ldap.SearchEntry = {
                dn: 'cn=John Doe,ou=users,dc=test,dc=com',
                attributes: [
                    { type: 'objectGUID', values: ['guid-123'] },
                    { type: 'sAMAccountName', values: ['jdoe'] },
                    { type: 'mail', values: ['john.doe@test.com'] },
                    { type: 'givenName', values: ['John'] },
                    { type: 'sn', values: ['Doe'] },
                    { type: 'memberOf', values: ['CN=Admins,OU=Groups'] },
                ],
            } as unknown as ldap.SearchEntry;

            const user = service.extractUserAttributes(entry, 'AD');

            expect(user.externalId).toBe('guid-123'); // Для AD используется objectGUID
            expect(user.email).toBe('john.doe@test.com');
        });

        it('должен выбросить ошибку если email не найден', () => {
            const entry: ldap.SearchEntry = {
                dn: 'cn=John Doe,ou=users,dc=test,dc=com',
                attributes: [
                    { type: 'cn', values: ['John Doe'] },
                    // Нет mail атрибута
                ],
            } as unknown as ldap.SearchEntry;

            expect(() => service.extractUserAttributes(entry, 'LDAP')).toThrow(
                'Email не найден',
            );
        });

        it('должен обработать Buffer значения в атрибутах', () => {
            const entry: ldap.SearchEntry = {
                dn: 'cn=John Doe,ou=users,dc=test,dc=com',
                attributes: [
                    {
                        type: 'mail',
                        values: [Buffer.from('john.doe@test.com', 'utf8')],
                    },
                    { type: 'givenName', values: ['John'] },
                ],
            } as unknown as ldap.SearchEntry;

            const user = service.extractUserAttributes(entry, 'LDAP');

            expect(user.email).toBe('john.doe@test.com');
        });
    });

    describe('disconnect', () => {
        it('должен закрыть подключение', async () => {
            await service.disconnect(mockClient);

            expect(mockClient.unbind).toHaveBeenCalledWith(
                expect.any(Function),
            );
        });

        it('должен обработать ошибку при закрытии', async () => {
            const error = new Error('Unbind failed');
            mockClient.unbind = jest
                .fn()
                .mockImplementation(
                    (callback?: (err: Error | null) => void) => {
                        if (callback) {
                            callback(error);
                        }
                    },
                ) as unknown as jest.Mocked<ldap.Client>['unbind'];

            // Не должно выбросить ошибку, только залогировать
            await expect(
                service.disconnect(mockClient),
            ).resolves.toBeUndefined();
        });
    });
});
