import { ExternalRoleProviderType, IProviderConfig } from '@app/domain/models';
import {
    IExternalRoleProvider,
    IExternalUser,
    IProviderConnectionResult,
    ISearchUsersResult,
} from '@app/domain/services/role/i-external-role-provider';
import { Injectable, Logger } from '@nestjs/common';
import * as ldap from 'ldapjs';
import { LDAPClientService } from './ldap-client.service';

/**
 * LDAPProvider
 *
 * Провайдер для работы с LDAP/AD серверами.
 * Реализует интерфейс IExternalRoleProvider для унифицированной работы
 * с внешними системами управления ролями.
 *
 * Поддерживает:
 * - LDAP (стандартный LDAP протокол)
 * - AD (Active Directory)
 */
@Injectable()
export class LDAPProvider implements IExternalRoleProvider {
    private readonly logger = new Logger(LDAPProvider.name);

    constructor(private readonly ldapClientService: LDAPClientService) {}

    /**
     * Получить тип провайдера
     */
    public getProviderType(): ExternalRoleProviderType {
        return 'LDAP'; // По умолчанию LDAP, для AD будет отдельный ADProvider
    }

    /**
     * Проверить подключение к LDAP серверу
     * Выполняет bind с указанными credentials для проверки доступности
     */
    public async testConnection(
        config: IProviderConfig,
    ): Promise<IProviderConnectionResult> {
        let client: ldap.Client | null = null;

        try {
            // Валидация обязательных полей
            const validation = await this.validateConfig(config);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Невалидная конфигурация: ${validation.errors.join(', ')}`,
                };
            }

            // Создаем клиент
            client = await this.ldapClientService.createClient(config);

            // Выполняем bind для проверки подключения
            if (config.bindDN && config.bindCredentials) {
                await this.ldapClientService.bind(
                    client,
                    config.bindDN,
                    config.bindCredentials,
                );
            }

            // Пытаемся выполнить простой поиск для проверки доступности
            const searchBase = config.searchBase ?? config.baseDN ?? '';
            if (searchBase) {
                await this.ldapClientService.search(
                    client,
                    searchBase,
                    '(objectClass=*)',
                    { limit: 1 },
                );
            }

            this.logger.debug({
                host: config.host,
                port: config.port,
                message: 'LDAP подключение успешно проверено',
            });

            return {
                success: true,
                providerInfo: {
                    name: 'LDAP',
                    capabilities: ['search', 'bind', 'user_sync'],
                },
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    host: config.host,
                    port: config.port,
                },
                'Ошибка при проверке LDAP подключения',
            );

            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            // Закрываем подключение
            if (client) {
                await this.ldapClientService.disconnect(client).catch(() => {
                    // Игнорируем ошибки при закрытии
                });
            }
        }
    }

    /**
     * Поиск пользователей в LDAP
     * Поддерживает пагинацию и фильтрацию
     */
    public async searchUsers(
        config: IProviderConfig,
        options?: {
            filter?: string;
            limit?: number;
            offset?: number;
            cursor?: string;
            modifiedSince?: Date;
        },
    ): Promise<ISearchUsersResult> {
        let client: ldap.Client | null = null;

        try {
            // Валидация конфигурации
            const validation = await this.validateConfig(config);
            if (!validation.valid) {
                throw new Error(
                    `Невалидная конфигурация: ${validation.errors.join(', ')}`,
                );
            }

            // Создаем клиент и выполняем bind
            client = await this.ldapClientService.createClient(config);

            if (config.bindDN && config.bindCredentials) {
                await this.ldapClientService.bind(
                    client,
                    config.bindDN,
                    config.bindCredentials,
                );
            }

            // Формируем фильтр поиска
            const searchFilter = this.buildSearchFilter(
                config.searchFilter ?? '(objectClass=user)',
                options?.filter,
                options?.modifiedSince,
            );

            // Определяем search base
            const searchBase = config.searchBase ?? config.baseDN ?? '';
            if (!searchBase) {
                throw new Error('searchBase или baseDN обязательны для поиска');
            }

            // Выполняем поиск
            const limit = options?.limit ?? 100;
            const offset = options?.offset ?? 0;

            const entries = await this.ldapClientService.search(
                client,
                searchBase,
                searchFilter,
                {
                    limit,
                    offset,
                    scope: 'sub',
                },
            );

            // Извлекаем пользователей из записей
            const users: IExternalUser[] = [];
            const providerType = this.getProviderType() as 'LDAP' | 'AD';

            for (const entry of entries) {
                try {
                    const user = this.ldapClientService.extractUserAttributes(
                        entry,
                        providerType,
                    );
                    users.push(user);
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);

                    this.logger.warn(
                        {
                            error: errorMessage,
                            dn: entry.dn.toString(),
                        },
                        'Ошибка при извлечении атрибутов пользователя',
                    );
                    // Продолжаем обработку других пользователей
                }
            }

            // Определяем, есть ли еще результаты
            const hasMore = entries.length === limit;

            this.logger.debug({
                searchBase,
                searchFilter,
                found: users.length,
                hasMore,
                message: 'LDAP поиск пользователей завершен',
            });

            return {
                users,
                totalCount: users.length, // LDAP не возвращает точное totalCount без дополнительных запросов
                hasMore,
                // Для LDAP используем offset как cursor (можно улучшить)
                nextCursor: hasMore ? String(offset + limit) : undefined,
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    host: config.host,
                    searchBase: config.searchBase ?? config.baseDN,
                },
                'Ошибка при поиске пользователей в LDAP',
            );

            throw error;
        } finally {
            if (client) {
                await this.ldapClientService.disconnect(client).catch(() => {
                    // Игнорируем ошибки при закрытии
                });
            }
        }
    }

    /**
     * Получить пользователя по ID (DN для LDAP, objectGUID для AD)
     */
    public async getUserById(
        config: IProviderConfig,
        externalUserId: string,
    ): Promise<IExternalUser | null> {
        let client: ldap.Client | null = null;

        try {
            client = await this.ldapClientService.createClient(config);

            if (config.bindDN && config.bindCredentials) {
                await this.ldapClientService.bind(
                    client,
                    config.bindDN,
                    config.bindCredentials,
                );
            }

            // Для LDAP externalUserId это DN
            // Выполняем поиск по DN
            const searchBase = externalUserId; // DN используется как searchBase
            const searchFilter = '(objectClass=*)'; // Любой объект

            const entries = await this.ldapClientService.search(
                client,
                searchBase,
                searchFilter,
                {
                    limit: 1,
                    scope: 'base', // Точное совпадение по DN
                },
            );

            if (process.env.NODE_ENV === 'test') {
                const firstEntry = entries[0] as ldap.SearchEntry & {
                    objectName?: unknown;
                };
                console.log('[LDAPProvider] getUserById search result:', {
                    externalUserId,
                    entriesCount: entries.length,
                    searchBase,
                    searchFilter,
                    firstEntry: firstEntry
                        ? {
                              dn: firstEntry.dn?.toString(),
                              objectName: firstEntry.objectName,
                              hasDn: !!firstEntry.dn,
                              hasObjectName: !!firstEntry.objectName,
                              attributesCount: firstEntry.attributes?.length,
                              attributesTypes: firstEntry.attributes?.map(
                                  (a) => a.type,
                              ),
                              entryKeys: Object.keys(firstEntry),
                              entryType: typeof firstEntry,
                          }
                        : null,
                });
            }

            if (entries.length === 0) {
                if (process.env.NODE_ENV === 'test') {
                    console.log(
                        '[LDAPProvider] getUserById: no entries found, returning null',
                    );
                }
                return null;
            }

            const providerType = this.getProviderType() as 'LDAP' | 'AD';
            const user = this.ldapClientService.extractUserAttributes(
                entries[0],
                providerType,
            );

            if (process.env.NODE_ENV === 'test') {
                console.log('[LDAPProvider] getUserById extracted user:', {
                    externalUserId,
                    userEmail: user.email,
                    userRoles: user.externalRoles,
                    userRolesLength: user.externalRoles?.length,
                });
            }

            return user;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    externalUserId,
                },
                'Ошибка при получении пользователя по ID из LDAP',
            );

            return null;
        } finally {
            if (client) {
                await this.ldapClientService.disconnect(client).catch(() => {
                    // Игнорируем ошибки при закрытии
                });
            }
        }
    }

    /**
     * Получить пользователя по email
     */
    public async getUserByEmail(
        config: IProviderConfig,
        email: string,
    ): Promise<IExternalUser | null> {
        let client: ldap.Client | null = null;

        try {
            client = await this.ldapClientService.createClient(config);

            if (config.bindDN && config.bindCredentials) {
                await this.ldapClientService.bind(
                    client,
                    config.bindDN,
                    config.bindCredentials,
                );
            }

            // Поиск по email (mail или userPrincipalName)
            const searchFilter = `(|(mail=${this.escapeLDAPFilter(email)})(userPrincipalName=${this.escapeLDAPFilter(email)}))`;
            const searchBase = config.searchBase ?? config.baseDN ?? '';

            if (!searchBase) {
                throw new Error('searchBase или baseDN обязательны для поиска');
            }

            const entries = await this.ldapClientService.search(
                client,
                searchBase,
                searchFilter,
                {
                    limit: 1,
                },
            );

            if (entries.length === 0) {
                return null;
            }

            const providerType = this.getProviderType() as 'LDAP' | 'AD';
            return this.ldapClientService.extractUserAttributes(
                entries[0],
                providerType,
            );
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    email: this.maskEmail(email),
                },
                'Ошибка при получении пользователя по email из LDAP',
            );

            return null;
        } finally {
            if (client) {
                await this.ldapClientService.disconnect(client).catch(() => {
                    // Игнорируем ошибки при закрытии
                });
            }
        }
    }

    /**
     * Получить список ролей/групп пользователя
     */
    public async getUserRoles(
        config: IProviderConfig,
        externalUserId: string,
    ): Promise<string[]> {
        if (process.env.NODE_ENV === 'test') {
            console.log('[LDAPProvider] getUserRoles called:', {
                externalUserId,
            });
        }

        const user = await this.getUserById(config, externalUserId);

        if (process.env.NODE_ENV === 'test') {
            console.log('[LDAPProvider] getUserRoles result:', {
                externalUserId,
                userFound: !!user,
                userEmail: user?.email,
                userRoles: user?.externalRoles,
                userRolesLength: user?.externalRoles?.length,
            });
        }

        if (!user) {
            return [];
        }

        return user.externalRoles ?? [];
    }

    /**
     * Валидация конфигурации LDAP провайдера
     */
    public async validateConfig(
        config: IProviderConfig,
    ): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Проверка обязательных полей
        if (!config.host) {
            errors.push('host обязателен');
        }

        if (!config.port) {
            errors.push('port обязателен');
        } else if (config.port < 1 || config.port > 65535) {
            errors.push('port должен быть в диапазоне 1-65535');
        }

        // Проверка baseDN или searchBase
        if (!config.baseDN && !config.searchBase) {
            errors.push('baseDN или searchBase обязательны');
        }

        // Проверка bindDN и bindCredentials (оба должны быть указаны или оба отсутствовать)
        if (
            (config.bindDN && !config.bindCredentials) ||
            (!config.bindDN && config.bindCredentials)
        ) {
            errors.push('bindDN и bindCredentials должны быть указаны вместе');
        }

        // Валидация timeout
        if (config.timeout !== undefined && config.timeout < 1000) {
            errors.push('timeout должен быть минимум 1000ms');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Построить LDAP фильтр поиска
     * Объединяет базовый фильтр, пользовательский фильтр и фильтр по дате изменения
     */
    private buildSearchFilter(
        baseFilter: string,
        customFilter?: string,
        modifiedSince?: Date,
    ): string {
        let filter = baseFilter;

        // Добавляем пользовательский фильтр
        if (customFilter) {
            filter = `(&${baseFilter}${customFilter})`;
        }

        // Добавляем фильтр по дате изменения для инкрементальной синхронизации
        if (modifiedSince) {
            // Формат LDAP времени: YYYYMMDDHHmmss.0Z
            const ldapTime = modifiedSince
                .toISOString()
                .replace(/[-:]/g, '')
                .replace(/\.\d{3}/, '.0')
                .replace('Z', 'Z');

            // Для AD используем whenChanged, для LDAP - modifyTimestamp
            const timeFilter = `(|(whenChanged>=${ldapTime})(modifyTimestamp>=${ldapTime}))`;
            filter = `(&${filter}${timeFilter})`;
        }

        return filter;
    }

    /**
     * Экранировать специальные символы в LDAP фильтре
     */
    private escapeLDAPFilter(value: string): string {
        // Экранируем специальные символы LDAP фильтра
        return value
            .replace(/\\/g, '\\5c')
            .replace(/\(/g, '\\28')
            .replace(/\)/g, '\\29')
            .replace(/\*/g, '\\2a')
            .replace(/\//g, '\\2f');
    }

    /**
     * Маскировать email для логирования
     */
    private maskEmail(email: string): string {
        const [localPart, domain] = email.split('@');
        if (!domain) {
            return email;
        }

        if (localPart.length <= 2) {
            return `${localPart[0]}***@${domain}`;
        }

        return `${localPart.substring(0, 2)}***@${domain}`;
    }
}
