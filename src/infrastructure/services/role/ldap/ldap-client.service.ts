import { IProviderConfig } from '@app/domain/models';
import { IExternalUser } from '@app/domain/services/role/i-external-role-provider';
import { Injectable, Logger } from '@nestjs/common';
import * as ldap from 'ldapjs';

/**
 * LDAPClientService
 *
 * Низкоуровневый сервис для работы с LDAP/AD серверами.
 * Отвечает за:
 * - Управление подключениями (connect/disconnect)
 * - Выполнение LDAP операций (search, bind)
 * - Извлечение и маппинг атрибутов пользователей
 * - Обработка ошибок подключения
 */
@Injectable()
export class LDAPClientService {
    private readonly logger = new Logger(LDAPClientService.name);

    /**
     * Создать подключение к LDAP серверу
     * @param config - Конфигурация провайдера
     * @returns LDAP клиент
     */
    public async createClient(config: IProviderConfig): Promise<ldap.Client> {
        if (!config.host || !config.port) {
            throw new Error('LDAP host и port обязательны для подключения');
        }

        const clientOptions: ldap.ClientOptions = {
            url: `ldap://${config.host}:${config.port}`,
            timeout: config.timeout ?? 30000,
            connectTimeout: config.timeout ?? 30000,
        };

        // Настройка TLS/SSL
        if (config.tlsOptions) {
            clientOptions.tlsOptions = {
                rejectUnauthorized:
                    config.tlsOptions.rejectUnauthorized ?? true,
            } as ldap.ClientOptions['tlsOptions'];

            if (config.tlsOptions.ca && config.tlsOptions.ca.length > 0) {
                (clientOptions.tlsOptions as { ca?: string[] }).ca =
                    config.tlsOptions.ca;
            }
        }

        const client = ldap.createClient(clientOptions);

        // Обработка ошибок подключения
        client.on('error', (err: Error) => {
            this.logger.error(
                {
                    error: err.message,
                    host: config.host,
                    port: config.port,
                },
                'Ошибка LDAP подключения',
            );
        });

        return client;
    }

    /**
     * Выполнить bind (аутентификацию) к LDAP серверу
     * @param client - LDAP клиент
     * @param bindDN - DN для bind
     * @param bindCredentials - Пароль для bind
     * @returns Promise, который резолвится при успешном bind
     */
    public async bind(
        client: ldap.Client,
        bindDN: string,
        bindCredentials: string,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            client.bind(bindDN, bindCredentials, (err: Error | null) => {
                if (err) {
                    this.logger.error(
                        {
                            error: err.message,
                            bindDN: this.maskDN(bindDN),
                        },
                        'Ошибка LDAP bind',
                    );
                    reject(err);
                    return;
                }

                this.logger.debug({
                    bindDN: this.maskDN(bindDN),
                    message: 'LDAP bind успешен',
                });

                resolve();
            });
        });
    }

    /**
     * Выполнить поиск пользователей в LDAP
     * @param client - LDAP клиент
     * @param searchBase - Base DN для поиска
     * @param searchFilter - LDAP фильтр (например, "(objectClass=user)")
     * @param options - Опции поиска (attributes, limit, offset)
     * @returns Массив найденных записей
     */
    public async search(
        client: ldap.Client,
        searchBase: string,
        searchFilter: string,
        options: {
            attributes?: string[];
            limit?: number;
            offset?: number;
            scope?: 'base' | 'one' | 'sub';
        } = {},
    ): Promise<ldap.SearchEntry[]> {
        const searchOptions: ldap.SearchOptions = {
            filter: searchFilter,
            scope: options.scope ?? 'sub',
            attributes: options.attributes ?? [
                'dn',
                'cn',
                'mail',
                'sAMAccountName',
                'userPrincipalName',
                'givenName',
                'sn',
                'displayName',
                'telephoneNumber',
                'memberOf',
                'objectGUID',
                'whenChanged',
            ],
            sizeLimit: options.limit ?? 1000,
            paged:
                options.limit && options.limit > 100
                    ? { pageSize: 100, pagePause: false }
                    : false, // Используем paged results для больших выборок
        };

        return new Promise((resolve, reject) => {
            const entries: ldap.SearchEntry[] = [];

            if (process.env.NODE_ENV === 'test') {
                this.logger.debug({
                    searchBase,
                    searchFilter,
                    searchOptions,
                    message: 'LDAP search starting',
                });
            }

            client.search(
                searchBase,
                searchOptions,
                (
                    err: Error | null,
                    res: ldap.SearchCallbackResponse | null,
                ) => {
                    if (process.env.NODE_ENV === 'test') {
                        console.log('[LDAPClient] Search callback called:', {
                            hasError: !!err,
                            errorMessage: err?.message,
                            hasResponse: !!res,
                            responseType: typeof res,
                        });
                    }

                    if (err) {
                        this.logger.error(
                            {
                                error: err.message,
                                searchBase,
                                searchFilter,
                            },
                            'Ошибка LDAP поиска',
                        );
                        reject(err);
                        return;
                    }

                    if (!res) {
                        if (process.env.NODE_ENV === 'test') {
                            console.error(
                                '[LDAPClient] Search response is null!',
                            );
                        }
                        reject(new Error('LDAP search response is null'));
                        return;
                    }

                    if (process.env.NODE_ENV === 'test') {
                        console.log(
                            '[LDAPClient] Setting up event listeners on response:',
                            {
                                hasOn: typeof res.on === 'function',
                                responseEvents: res.eventNames
                                    ? res.eventNames()
                                    : 'unknown',
                            },
                        );
                    }

                    res.on('searchEntry', (entry: ldap.SearchEntry) => {
                        if (process.env.NODE_ENV === 'test') {
                            const entryWithObjectName =
                                entry as ldap.SearchEntry & {
                                    objectName?: unknown;
                                };
                            console.log(
                                '[LDAPClient] searchEntry event received!',
                                {
                                    dn: entry.dn?.toString(),
                                    objectName: entryWithObjectName.objectName,
                                    attributesCount: entry.attributes?.length,
                                    attributesTypes: entry.attributes?.map(
                                        (a) => a.type,
                                    ),
                                    entryType: typeof entry,
                                    entryKeys: Object.keys(entry),
                                    hasAttributes: !!entry.attributes,
                                    attributesIsArray: Array.isArray(
                                        entry.attributes,
                                    ),
                                    entryConstructor: entry.constructor?.name,
                                },
                            );
                        }
                        this.logger.debug({
                            dn: entry.dn?.toString(),
                            attributesCount: entry.attributes?.length,
                            message: 'LDAP searchEntry received',
                        });
                        entries.push(entry);
                    });

                    res.on('error', (searchErr: Error) => {
                        this.logger.error(
                            {
                                error: searchErr.message,
                                searchBase,
                                searchFilter,
                            },
                            'Ошибка при обработке LDAP результатов',
                        );
                        reject(searchErr);
                    });

                    res.on('end', (result: ldap.Control[] | null) => {
                        if (process.env.NODE_ENV === 'test') {
                            console.log('[LDAPClient] end event received:', {
                                entriesCount: entries.length,
                                result: result,
                                message: 'LDAP поиск завершен',
                            });
                        }

                        this.logger.debug({
                            searchBase,
                            searchFilter,
                            count: entries.length,
                            message: 'LDAP поиск завершен',
                        });

                        // Применяем offset и limit
                        let filteredEntries = entries;
                        if (options.offset && options.offset > 0) {
                            filteredEntries = filteredEntries.slice(
                                options.offset,
                            );
                        }
                        if (options.limit && options.limit > 0) {
                            filteredEntries = filteredEntries.slice(
                                0,
                                options.limit,
                            );
                        }
                        resolve(filteredEntries);
                    });

                    res.on('error', (searchErr: Error) => {
                        if (process.env.NODE_ENV === 'test') {
                            console.error(
                                '[LDAPClient] error event received:',
                                {
                                    error: searchErr.message,
                                    stack: searchErr.stack,
                                },
                            );
                        }

                        this.logger.error(
                            {
                                error: searchErr.message,
                                searchBase,
                                searchFilter,
                            },
                            'Ошибка при обработке LDAP результатов',
                        );
                        reject(searchErr);
                    });
                },
            );
        });
    }

    /**
     * Извлечь информацию о пользователе из LDAP записи
     * @param entry - LDAP SearchEntry
     * @param providerType - Тип провайдера ('LDAP' или 'AD')
     * @returns IExternalUser объект
     */
    public extractUserAttributes(
        entry: ldap.SearchEntry,
        providerType: 'LDAP' | 'AD' = 'LDAP',
    ): IExternalUser {
        const attributes = entry.attributes;

        // Получить значение атрибута (может быть массивом)
        // ВАЖНО: Регистронезависимый поиск, так как после патча ldapjs атрибуты могут быть в нижнем регистре
        const getAttributeValue = (name: string): string | undefined => {
            const nameLower = name.toLowerCase();
            const attr = attributes.find(
                (a) => a.type.toLowerCase() === nameLower,
            );
            if (!attr) {
                return undefined;
            }

            // ldapjs возвращает Buffer для некоторых атрибутов
            if (Buffer.isBuffer(attr.values[0])) {
                return attr.values[0].toString('utf8');
            }

            return Array.isArray(attr.values) && attr.values.length > 0
                ? String(attr.values[0])
                : undefined;
        };

        // Получить массив значений атрибута
        // ВАЖНО: Регистронезависимый поиск, так как после патча ldapjs атрибуты могут быть в нижнем регистре
        const getAttributeArray = (name: string): string[] => {
            const nameLower = name.toLowerCase();
            const attr = attributes.find(
                (a) => a.type.toLowerCase() === nameLower,
            );
            if (!attr || !Array.isArray(attr.values)) {
                return [];
            }

            return attr.values.map((value) => {
                if (Buffer.isBuffer(value)) {
                    return value.toString('utf8');
                }
                return String(value);
            });
        };

        // Определяем externalId в зависимости от типа провайдера
        let externalId: string;
        if (providerType === 'AD') {
            // Для AD используем objectGUID или sAMAccountName
            externalId =
                getAttributeValue('objectGUID') ??
                getAttributeValue('sAMAccountName') ??
                entry.dn.toString();
        } else {
            // Для LDAP используем DN
            externalId = entry.dn.toString();
        }

        // Извлекаем email
        const email =
            getAttributeValue('mail') ??
            getAttributeValue('userPrincipalName') ??
            getAttributeValue('email') ??
            '';

        if (!email) {
            throw new Error(`Email не найден для пользователя ${externalId}`);
        }

        // Извлекаем роли/группы
        const externalRoles = getAttributeArray('memberOf').map((dn) => {
            // Извлекаем CN из DN (например, "CN=Admins,OU=Groups,DC=company,DC=com" -> "Admins")
            const cnMatch = dn.match(/^CN=([^,]+)/i);
            return cnMatch ? cnMatch[1] : dn;
        });

        return {
            externalId,
            email,
            firstName:
                getAttributeValue('givenName') ??
                getAttributeValue('cn')?.split(' ')[0],
            lastName:
                getAttributeValue('sn') ??
                getAttributeValue('cn')?.split(' ').slice(1).join(' '),
            displayName:
                getAttributeValue('displayName') ?? getAttributeValue('cn'),
            phone:
                getAttributeValue('telephoneNumber') ??
                getAttributeValue('mobile'),
            externalRoles,
            attributes: {
                dn: entry.dn.toString(),
                sAMAccountName: getAttributeValue('sAMAccountName'),
                userPrincipalName: getAttributeValue('userPrincipalName'),
                objectGUID: getAttributeValue('objectGUID'),
                whenChanged: getAttributeValue('whenChanged'),
            },
        };
    }

    /**
     * Закрыть подключение к LDAP серверу
     * @param client - LDAP клиент
     */
    public async disconnect(client: ldap.Client): Promise<void> {
        return new Promise((resolve) => {
            client.unbind((err: Error | null) => {
                if (err) {
                    this.logger.warn(
                        {
                            error: err.message,
                        },
                        'Ошибка при закрытии LDAP подключения',
                    );
                } else {
                    this.logger.debug('LDAP подключение закрыто');
                }
                resolve();
            });
        });
    }

    /**
     * Маскировать DN для логирования (скрыть чувствительные данные)
     * @param dn - Distinguished Name
     * @returns Замаскированный DN
     */
    private maskDN(dn: string): string {
        // Маскируем пароли и чувствительные части DN
        return dn.replace(/password=[^,]+/gi, 'password=***');
    }
}
