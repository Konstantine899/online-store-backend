/**
 * Mock LDAP сервер для integration тестов
 * Использует ldapjs для создания тестового LDAP сервера
 *
 * Related to: SAAS-017-19, Этап 2
 */

import * as ldap from 'ldapjs';
import * as net from 'net';

export interface MockLDAPServerOptions {
    port?: number;
    baseDN?: string;
    users?: Array<{
        dn: string;
        attributes: Record<string, string | string[]>;
    }>;
}

interface MockLDAPEntry {
    dn: string;
    attributes: Array<{
        type: string;
        values: (string | Buffer)[];
    }>;
}

export class MockLDAPServer {
    private server: ldap.Server | null = null;
    private port: number;
    private baseDN: string;
    private users: Map<string, MockLDAPEntry> = new Map();

    constructor(options: MockLDAPServerOptions = {}) {
        this.port = options.port ?? 1389;
        this.baseDN = options.baseDN ?? 'dc=test,dc=com';

        // Инициализируем пользователей
        const defaultUsers = options.users ?? [
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
        ];

        defaultUsers.forEach((user) => {
            const entry = this.createSearchEntry(user.dn, user.attributes);
            this.users.set(user.dn.toLowerCase(), entry);
        });
    }

    /**
     * Создать SearchEntry из данных
     * Используем правильный API ldapjs для создания записей
     */
    private createSearchEntry(
        dn: string,
        attributes: Record<string, string | string[]>,
    ): MockLDAPEntry {
        // Создаем объект, который имитирует SearchEntry
        // ldapjs использует специальный формат для записей
        const entry: MockLDAPEntry = {
            dn: dn,
            attributes: [],
        };

        // Создаем атрибуты в формате, который ожидает ldapjs
        for (const [key, value] of Object.entries(attributes)) {
            const attr = {
                type: key,
                values: Array.isArray(value) ? value : [value],
            };
            entry.attributes.push(attr);
        }

        return entry;
    }

    /**
     * Запустить mock LDAP сервер
     */
    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Таймаут для предотвращения зависания
            const timeout = setTimeout(() => {
                reject(new Error('LDAP server start timeout'));
            }, 10000);

            try {
                this.server = ldap.createServer();

                // Обработка bind (аутентификации)
                // В ldapjs bind обработчик принимает req, res, next
                // req содержит dn и credentials
                const bindHandler = (
                    req: unknown,
                    res: unknown,
                    next: () => void,
                ): void => {
                    const response = res as { end: () => void };
                    // Успешный bind для тестов - просто завершаем запрос
                    response.end();
                    if (next) {
                        next();
                    }
                };

                // Регистрируем обработчик для baseDN
                this.server.bind(this.baseDN, bindHandler);

                // Также обрабатываем bind для конкретного DN (bindDN)
                this.server.bind('cn=admin,dc=test,dc=com', bindHandler);

                // Обработка поиска
                // Регистрируем обработчик для baseDN и для ou=users
                const searchHandler = (
                    req: unknown,
                    res: unknown,
                    next: () => void,
                ): void => {
                    const request = req as {
                        filter?: unknown;
                        scope?: number | string; // ldapjs передает scope как число: 0=base, 1=one, 2=sub
                        baseObject?: { toString: () => string } | string;
                        attributes?: string[]; // Запрошенные атрибуты клиентом
                    };
                    // ldapjs сервер response.send() принимает простой объект с dn и attributes
                    // Согласно примеру inmemory.js: res.send({ dn: key, attributes: db[key] })
                    const response = res as {
                        send: (entry: {
                            dn: string; // DN как строка (НЕ objectName!)
                            attributes:
                                | Record<string, string | string[]>
                                | Array<{
                                      type: string;
                                      values: (string | Buffer)[];
                                  }>;
                        }) => void;
                        end: () => void;
                    };
                    const filter = request.filter;

                    // Детальное логирование входящего запроса
                    if (process.env.NODE_ENV === 'test') {
                        console.log('[MockLDAP] === SEARCH REQUEST START ===');
                        console.log('[MockLDAP] Request details:', {
                            filter: String(filter),
                            scope: request.scope,
                            baseObject:
                                typeof request.baseObject === 'string'
                                    ? request.baseObject
                                    : request.baseObject?.toString(),
                            requestedAttributes: request.attributes,
                            responseType: typeof response,
                            hasSend: typeof response.send === 'function',
                            hasEnd: typeof response.end === 'function',
                        });
                    }
                    // ldapjs передает scope как число: 0=base, 1=one, 2=sub
                    const scopeValue = request.scope ?? 2;
                    const scope =
                        scopeValue === 0
                            ? 'base'
                            : scopeValue === 1
                              ? 'one'
                              : 'sub';
                    // baseObject может быть строкой или объектом с toString()
                    const baseObject =
                        typeof request.baseObject === 'string'
                            ? request.baseObject
                            : request.baseObject
                              ? request.baseObject.toString()
                              : '';

                    // Отладочный вывод (только для тестов)
                    if (process.env.NODE_ENV === 'test') {
                        console.log('[MockLDAP] Search request:', {
                            filter: String(filter),
                            scope,
                            baseObject,
                            usersCount: this.users.size,
                            userDNs: Array.from(this.users.keys()),
                        });
                    }

                    // Для scope='base' с фильтром objectClass=* всегда принимаем все записи
                    // (это используется в getUserById)
                    const isBaseScopeWithWildcard =
                        scope === 'base' &&
                        filter &&
                        String(filter).includes('objectClass=*');

                    // Отладочный вывод для base scope
                    if (process.env.NODE_ENV === 'test' && scope === 'base') {
                        // baseObject уже преобразован в строку выше (строки 158-163)
                        console.log('[MockLDAP] Base scope check:', {
                            baseObject,
                            baseObjectType: typeof baseObject,
                            userDNs: Array.from(this.users.keys()),
                            isBaseScopeWithWildcard,
                        });
                    }

                    // Простая обработка фильтров
                    // Для тестов упрощаем логику: всегда возвращаем всех пользователей,
                    // если scope === 'sub' (для тестов)
                    const matchingUsers: MockLDAPEntry[] = [];

                    // Для тестов: если scope === 'sub', возвращаем всех пользователей
                    // независимо от baseObject и фильтра (упрощение для тестов)
                    const isTestScope = scope === 'sub';

                    for (const [dn, entry] of this.users.entries()) {
                        let matches = true;

                        // Проверяем scope сначала
                        if (scope === 'base') {
                            // Base scope: только точное совпадение DN
                            // Для тестов: проверяем точное совпадение DN с baseObject
                            if (baseObject) {
                                const dnLower = dn.toLowerCase();
                                // baseObject уже преобразован в строку выше (строки 158-163)
                                const baseLower = baseObject.toLowerCase();

                                // Отладочный вывод для base scope
                                if (process.env.NODE_ENV === 'test') {
                                    console.log(
                                        '[MockLDAP] Base scope match check:',
                                        {
                                            dn: dnLower,
                                            base: baseLower,
                                            match: dnLower === baseLower,
                                        },
                                    );
                                }

                                if (dnLower !== baseLower) {
                                    continue; // Пропускаем, если DN не совпадает
                                }
                            }
                        }
                        // Для sub scope проверяем, что DN находится в поддереве baseObject
                        else if (
                            scope === 'sub' &&
                            baseObject &&
                            !isTestScope
                        ) {
                            // Упрощенная проверка: DN должен заканчиваться на baseObject
                            const dnLower = dn.toLowerCase();
                            const baseLower = baseObject.toLowerCase();

                            // Проверяем, что DN заканчивается на baseObject (с запятой или без)
                            const endsWithBase =
                                dnLower.endsWith(',' + baseLower) ||
                                dnLower === baseLower;

                            if (!endsWithBase) {
                                // Также проверяем, что DN содержит baseObject как часть пути
                                const dnParts = dnLower.split(',').reverse();
                                const baseParts = baseLower
                                    .split(',')
                                    .reverse();
                                let isSubtree = true;
                                for (let i = 0; i < baseParts.length; i++) {
                                    if (
                                        i >= dnParts.length ||
                                        dnParts[i] !== baseParts[i]
                                    ) {
                                        isSubtree = false;
                                        break;
                                    }
                                }
                                if (!isSubtree) {
                                    continue; // Пропускаем, если не в поддереве
                                }
                            }
                        }

                        // Простая проверка фильтра (для тестов)
                        // Для scope='base' с фильтром objectClass=* всегда принимаем все записи
                        // (это используется в getUserById)
                        if (isBaseScopeWithWildcard) {
                            // Для base scope с objectClass=* принимаем запись (DN уже проверен выше)
                            matches = true;

                            if (process.env.NODE_ENV === 'test') {
                                console.log(
                                    '[MockLDAP] Base scope with wildcard filter - accepting entry:',
                                    {
                                        dn: entry.dn,
                                        matches,
                                    },
                                );
                            }
                        } else if (filter) {
                            const filterStr = String(filter);

                            // Проверяем фильтр objectClass=* (любой объект) - принимаем все
                            if (filterStr.includes('objectClass=*')) {
                                matches = true;
                            }
                            // Для тестов: если scope === 'sub' и нет специальных фильтров,
                            // всегда принимаем записи с objectClass=user
                            else if (isTestScope && !filterStr.includes('(|')) {
                                // Проверяем, что у записи есть objectClass=user
                                const objectClassAttr = entry.attributes.find(
                                    (a) => a.type === 'objectClass',
                                );
                                if (objectClassAttr) {
                                    let found = false;
                                    for (const val of objectClassAttr.values) {
                                        const valStr =
                                            typeof val === 'string'
                                                ? val
                                                : val.toString('utf8');
                                        if (valStr === 'user') {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        matches = false;
                                    }
                                } else {
                                    matches = false;
                                }
                            }
                            // Проверяем OR фильтр (|(mail=...)(userPrincipalName=...))
                            else if (
                                filterStr.includes('(|') ||
                                filterStr.startsWith('(|')
                            ) {
                                // Извлекаем значения из OR фильтра
                                // Формат: (|(mail=john.doe@test.com)(userPrincipalName=john.doe@test.com))
                                const mailMatch =
                                    filterStr.match(/mail=([^)]+)/);
                                const upnMatch = filterStr.match(
                                    /userPrincipalName=([^)]+)/,
                                );

                                let orMatch = false;

                                if (mailMatch) {
                                    // Извлекаем email, убирая скобки и экранирующие символы
                                    const email = mailMatch[1]
                                        .replace(/[()]/g, '')
                                        .trim();
                                    const mailAttr = entry.attributes.find(
                                        (a) => a.type === 'mail',
                                    );
                                    if (mailAttr) {
                                        // Проверяем все значения атрибута
                                        for (const val of mailAttr.values) {
                                            const valStr =
                                                typeof val === 'string'
                                                    ? val
                                                    : val.toString('utf8');
                                            if (valStr === email) {
                                                orMatch = true;
                                                break;
                                            }
                                        }
                                    }
                                }

                                if (!orMatch && upnMatch) {
                                    const upn = upnMatch[1]
                                        .replace(/[()]/g, '')
                                        .trim();
                                    const upnAttr = entry.attributes.find(
                                        (a) => a.type === 'userPrincipalName',
                                    );
                                    if (upnAttr) {
                                        for (const val of upnAttr.values) {
                                            const valStr =
                                                typeof val === 'string'
                                                    ? val
                                                    : val.toString('utf8');
                                            if (valStr === upn) {
                                                orMatch = true;
                                                break;
                                            }
                                        }
                                    }
                                }

                                matches = orMatch;
                            }
                            // Проверяем фильтр по email (mail=...)
                            else if (filterStr.includes('mail=')) {
                                const emailMatch =
                                    filterStr.match(/mail=([^)]+)/);
                                if (emailMatch) {
                                    const email = emailMatch[1]
                                        .replace(/[()]/g, '')
                                        .trim();
                                    const mailAttr = entry.attributes.find(
                                        (a) => a.type === 'mail',
                                    );
                                    if (mailAttr) {
                                        let found = false;
                                        for (const val of mailAttr.values) {
                                            const valStr =
                                                typeof val === 'string'
                                                    ? val
                                                    : val.toString('utf8');
                                            if (valStr === email) {
                                                found = true;
                                                break;
                                            }
                                        }
                                        if (!found) {
                                            matches = false;
                                        }
                                    } else {
                                        matches = false;
                                    }
                                }
                            }
                            // Проверяем наличие objectClass=user (базовый фильтр)
                            else if (filterStr.includes('objectClass=user')) {
                                const objectClassAttr = entry.attributes.find(
                                    (a) => a.type === 'objectClass',
                                );
                                if (objectClassAttr) {
                                    let found = false;
                                    for (const val of objectClassAttr.values) {
                                        const valStr =
                                            typeof val === 'string'
                                                ? val
                                                : val.toString('utf8');
                                        if (valStr === 'user') {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        matches = false;
                                    }
                                } else {
                                    matches = false;
                                }
                            }
                            // Для других фильтров принимаем все записи с objectClass=user
                            else {
                                const objectClassAttr = entry.attributes.find(
                                    (a) => a.type === 'objectClass',
                                );
                                if (objectClassAttr) {
                                    let found = false;
                                    for (const val of objectClassAttr.values) {
                                        const valStr =
                                            typeof val === 'string'
                                                ? val
                                                : val.toString('utf8');
                                        if (valStr === 'user') {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        matches = false;
                                    }
                                } else {
                                    matches = false;
                                }
                            }
                        }

                        if (matches) {
                            matchingUsers.push(entry);

                            if (
                                process.env.NODE_ENV === 'test' &&
                                scope === 'base'
                            ) {
                                console.log(
                                    '[MockLDAP] Entry matched and added:',
                                    {
                                        dn: entry.dn,
                                        scope,
                                        matches,
                                    },
                                );
                            }
                        } else {
                            if (
                                process.env.NODE_ENV === 'test' &&
                                scope === 'base'
                            ) {
                                console.log('[MockLDAP] Entry NOT matched:', {
                                    dn: entry.dn,
                                    scope,
                                    matches,
                                    filter: String(filter),
                                });
                            }
                        }
                    }

                    // Отладочный вывод (только для тестов)
                    if (process.env.NODE_ENV === 'test') {
                        console.log(
                            '[MockLDAP] Matching users:',
                            matchingUsers.length,
                        );
                    }

                    // Отправляем результаты в правильном формате ldapjs.SearchEntry
                    // ldapjs использует специальный формат для SearchEntry
                    // Используем асинхронную отправку для правильной работы с событиями
                    let sentCount = 0;
                    const totalCount = matchingUsers.length;

                    if (totalCount === 0) {
                        // Если нет результатов, сразу завершаем
                        if (process.env.NODE_ENV === 'test') {
                            console.log(
                                '[MockLDAP] No matching users, ending search',
                            );
                        }
                        response.end();
                        if (next) {
                            next();
                        }
                        return;
                    }

                    // Отправляем каждую запись асинхронно
                    for (const entry of matchingUsers) {
                        try {
                            // Создаем объект в формате, который ожидает ldapjs сервер
                            // Согласно примеру inmemory.js: res.send({ dn: key, attributes: db[key] })
                            // ldapjs сервер response.send() принимает объект с dn (строка) и attributes
                            // ВАЖНО: ldapjs фильтрует атрибуты, сравнивая их в нижнем регистре (search_response.js:67)
                            // Проблема: self.attributes содержит атрибуты в том же регистре, что и запросил клиент
                            // Но сравнение идет в нижнем регистре, поэтому нужно отправлять атрибуты в том же регистре
                            // что и запросил клиент, ИЛИ убедиться, что self.attributes тоже в нижнем регистре
                            // Проверяем, какие атрибуты запросил клиент, и отправляем только их
                            const attributesObj: Record<
                                string,
                                string | string[]
                            > = {};

                            // Отправляем все атрибуты из entry без фильтрации
                            // ldapjs сам отфильтрует их на основе req.attributes
                            // ВАЖНО: отправляем атрибуты в том же регистре, что и запросил клиент
                            // чтобы self.attributes.indexOf(_a) нашел совпадение
                            const requestedAttrs = request.attributes ?? [];

                            // Отправляем все атрибуты из entry без фильтрации
                            // ldapjs сам отфильтрует их на основе req.attributes
                            // ВАЖНО: отправляем атрибуты в том же регистре, что и запросил клиент
                            // чтобы self.attributes.indexOf(_a) нашел совпадение
                            entry.attributes.forEach((attr) => {
                                const values = attr.values.map((v) => {
                                    return typeof v === 'string'
                                        ? v
                                        : v.toString('utf8');
                                });

                                const attrTypeLower = attr.type.toLowerCase();

                                // КРИТИЧНО: ldapjs использует indexOf для поиска в нижнем регистре
                                // self.attributes.indexOf(_a) где _a = a.toLowerCase()
                                // Проблема: indexOf не работает с регистронезависимым сравнением
                                // Если self.attributes = ['givenName'], а _a = 'givenname',
                                // то indexOf('givenname') в ['givenName'] вернет -1
                                // РЕШЕНИЕ: отправляем атрибуты в нижнем регистре
                                // чтобы indexOf нашел совпадение (self.attributes будет содержать атрибуты в исходном регистре,
                                // но ldapjs преобразует их в нижний регистр для сравнения)
                                const attrKey = attrTypeLower;

                                // Если одно значение - строка, иначе массив
                                attributesObj[attrKey] =
                                    values.length === 1 ? values[0] : values;
                            });

                            const searchEntry = {
                                dn: entry.dn, // DN как строка (НЕ objectName!)
                                attributes: attributesObj, // Объект с атрибутами
                            };

                            // Отладочный вывод (только для тестов)
                            if (process.env.NODE_ENV === 'test') {
                                console.log('[MockLDAP] Sending entry:', {
                                    dn: entry.dn,
                                    searchEntryDn: searchEntry.dn,
                                    attributesCount: Object.keys(
                                        searchEntry.attributes,
                                    ).length,
                                    attributesTypes: Object.keys(
                                        searchEntry.attributes,
                                    ),
                                    requestedAttributes: requestedAttrs,
                                    attributesObj: searchEntry.attributes,
                                });
                            }

                            // Отправляем запись синхронно (ldapjs обрабатывает это правильно)
                            // Пробуем использовать try-catch для отлова ошибок при отправке
                            if (process.env.NODE_ENV === 'test') {
                                console.log(
                                    '[MockLDAP] Attempting to send entry:',
                                    {
                                        entryIndex: sentCount + 1,
                                        totalEntries: totalCount,
                                        dn: searchEntry.dn,
                                        attributesCount: Object.keys(
                                            searchEntry.attributes,
                                        ).length,
                                        attributesTypes: Object.keys(
                                            searchEntry.attributes,
                                        ),
                                    },
                                );
                            }

                            try {
                                response.send(searchEntry);
                                sentCount++;

                                if (process.env.NODE_ENV === 'test') {
                                    console.log(
                                        '[MockLDAP] Entry sent successfully:',
                                        {
                                            entryIndex: sentCount,
                                            dn: searchEntry.dn,
                                        },
                                    );
                                }
                            } catch (sendError) {
                                // Отладочный вывод ошибок (только для тестов)
                                if (process.env.NODE_ENV === 'test') {
                                    console.error(
                                        '[MockLDAP] ERROR in response.send():',
                                        {
                                            error: sendError,
                                            errorMessage:
                                                sendError instanceof Error
                                                    ? sendError.message
                                                    : String(sendError),
                                            errorStack:
                                                sendError instanceof Error
                                                    ? sendError.stack
                                                    : undefined,
                                            entryIndex: sentCount + 1,
                                            dn: searchEntry.dn,
                                        },
                                    );
                                }
                                // Продолжаем отправку других записей даже при ошибке
                                sentCount++;
                            }

                            // После отправки последней записи завершаем ответ
                            if (sentCount === totalCount) {
                                if (process.env.NODE_ENV === 'test') {
                                    console.log(
                                        '[MockLDAP] All entries sent, ending search response:',
                                        {
                                            totalSent: sentCount,
                                            totalExpected: totalCount,
                                        },
                                    );
                                }

                                try {
                                    response.end();
                                    if (process.env.NODE_ENV === 'test') {
                                        console.log(
                                            '[MockLDAP] response.end() called successfully',
                                        );
                                    }
                                } catch (endError) {
                                    if (process.env.NODE_ENV === 'test') {
                                        console.error(
                                            '[MockLDAP] ERROR in response.end():',
                                            endError,
                                        );
                                    }
                                }

                                if (process.env.NODE_ENV === 'test') {
                                    console.log(
                                        '[MockLDAP] === SEARCH REQUEST END ===',
                                    );
                                }

                                if (next) {
                                    next();
                                }
                            }
                        } catch (error) {
                            // Отладочный вывод ошибок (только для тестов)
                            if (process.env.NODE_ENV === 'test') {
                                console.error(
                                    '[MockLDAP] Error sending entry:',
                                    error,
                                );
                            }
                            // Продолжаем отправку других записей даже при ошибке
                            sentCount++;
                            if (sentCount === totalCount) {
                                response.end();
                                if (next) {
                                    next();
                                }
                            }
                        }
                    }
                };

                // Регистрируем обработчик для baseDN
                this.server.search(this.baseDN, searchHandler);

                // Также регистрируем для ou=users (часто используется в тестах)
                this.server.search('ou=users,dc=test,dc=com', searchHandler);

                // Обработка ошибок сервера
                this.server.on('error', (err: Error) => {
                    clearTimeout(timeout);
                    reject(err);
                });

                // Запускаем сервер
                // Для порта 0 используем другой подход - находим свободный порт
                if (this.port === 0) {
                    // Используем временный сервер для получения свободного порта
                    const tempServer = net.createServer();
                    tempServer.listen(0, () => {
                        const tempPort = (
                            tempServer.address() as { port: number }
                        ).port;
                        tempServer.close(() => {
                            this.port = tempPort;
                            this.startOnPort(resolve, reject, timeout);
                        });
                    });
                } else {
                    this.startOnPort(resolve, reject, timeout);
                }
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Запустить сервер на указанном порту
     * @private
     */
    private startOnPort(
        resolve: () => void,
        reject: (error: Error) => void,
        timeout: NodeJS.Timeout,
    ): void {
        if (!this.server) {
            clearTimeout(timeout);
            reject(new Error('Server not initialized'));
            return;
        }

        // Используем listen с обработкой событий
        this.server.listen(this.port, () => {
            clearTimeout(timeout);
            // Получаем реальный порт (если был указан 0)
            const serverInstance = this.server as unknown as {
                address: () => { port: number } | null;
            };
            const address = serverInstance.address();
            if (address && typeof address === 'object' && 'port' in address) {
                this.port = address.port;
            }
            resolve();
        });

        this.server.on('error', (err: Error) => {
            clearTimeout(timeout);
            reject(err);
        });
    }

    /**
     * Остановить mock LDAP сервер
     */
    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }

            this.server.close((err?: Error) => {
                if (err) {
                    reject(err);
                } else {
                    this.server = null;
                    resolve();
                }
            });
        });
    }

    /**
     * Получить порт сервера
     */
    public getPort(): number {
        return this.port;
    }

    /**
     * Получить base DN
     */
    public getBaseDN(): string {
        return this.baseDN;
    }

    /**
     * Добавить пользователя в mock сервер
     */
    public addUser(
        dn: string,
        attributes: Record<string, string | string[]>,
    ): void {
        const entry = this.createSearchEntry(dn, attributes);
        this.users.set(dn.toLowerCase(), entry);
    }

    /**
     * Удалить пользователя из mock сервера
     */
    public removeUser(dn: string): void {
        this.users.delete(dn.toLowerCase());
    }
}
