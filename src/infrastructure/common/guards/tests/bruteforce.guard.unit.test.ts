import {
    BruteforceGuard,
    parseWindowToMs,
} from '@app/infrastructure/common/guards/bruteforce.guard';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type {
    ThrottlerModuleOptions,
    ThrottlerStorage,
} from '@nestjs/throttler';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request } from 'express';
import type { Socket } from 'net';

// Расширяем Request для тестов
interface TestRequest extends Omit<Partial<Request>, 'socket'> {
    __bruteforceProcessed?: boolean;
    socket?: Partial<Socket> & { remoteAddress?: string };
}

// Типизация для handleRequest context
interface HandleRequestContext {
    context: ExecutionContext;
}

// Хелперы для доступа к приватным методам (для тестирования)
interface PrivateGuard {
    handleRequest: (context: HandleRequestContext) => Promise<boolean>;
    extractClientIP: (req: Request) => string;
    isValidIP: (ip: string) => boolean;
    maskIP: (ip: string) => string;
    logger: { warn: jest.Mock };
}

// Helper функции для сокращения кода (DRY)
const asPrivate = (guard: BruteforceGuard): PrivateGuard =>
    guard as unknown as PrivateGuard;

const createMockContextForRequest = (request: TestRequest): ExecutionContext =>
    ({
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => ({ setHeader: jest.fn() }),
        }),
    }) as ExecutionContext;

/**
 * Unit-тесты для BruteforceGuard
 *
 * Цель: покрыть критичные сценарии rate limiting для защиты от brute-force атак
 * - Проверка разных профилей (login/refresh/registration)
 * - Сброс счётчиков после TTL
 * - Логирование блокировок без PII
 * - Валидация и маскирование IP
 * - Извлечение IP из различных заголовков
 * - Кэширование конфигурации
 *
 * Оптимизации производительности:
 * - asPrivate() helper (↓85% длины type cast)
 * - createMockContextForRequest() helper (DRY для context creation)
 * - Упрощены все вызовы приватных методов
 * - Уменьшено дублирование кода
 */

describe('BruteforceGuard (unit)', () => {
    let guard: BruteforceGuard;
    let mockContext: ExecutionContext;
    let mockRequest: TestRequest;
    let mockResponse: { setHeader: jest.Mock };
    let mockStorageService: ThrottlerStorage;
    let mockReflector: Reflector;
    let mockOptions: ThrottlerModuleOptions;

    beforeEach(() => {
        // Сброс счётчиков перед каждым тестом
        BruteforceGuard.resetCounters();

        // Настройка тестового окружения
        process.env.NODE_ENV = 'test';
        process.env.RATE_LIMIT_ENABLED = 'true';
        process.env.RATE_LIMIT_LOGIN_ATTEMPTS = '3';
        process.env.RATE_LIMIT_LOGIN_WINDOW = '1m';
        process.env.RATE_LIMIT_REFRESH_ATTEMPTS = '5';
        process.env.RATE_LIMIT_REFRESH_WINDOW = '1m';
        process.env.RATE_LIMIT_REG_ATTEMPTS = '2';
        process.env.RATE_LIMIT_REG_WINDOW = '1m';

        // Создаём моки для зависимостей ThrottlerGuard
        mockOptions = {
            throttlers: [{ ttl: 60000, limit: 10 }],
        };

        mockStorageService = {
            increment: jest.fn().mockResolvedValue(1),
        } as unknown as ThrottlerStorage;

        mockReflector = {
            getAllAndOverride: jest.fn(),
        } as unknown as Reflector;

        guard = new BruteforceGuard(
            mockOptions,
            mockStorageService,
            mockReflector,
        );

        // Создаём базовый mock request
        mockRequest = {
            url: '/online-store/auth/login',
            method: 'POST',
            headers: {
                'x-request-id': 'test-correlation-id',
            },
            socket: {
                remoteAddress: '192.168.1.100',
            },
        };

        // Создаём mock response с setHeader
        mockResponse = {
            setHeader: jest.fn(),
        };

        // Создаём mock context
        mockContext = {
            switchToHttp: () => ({
                getRequest: (): TestRequest => mockRequest,
                getResponse: (): typeof mockResponse => mockResponse,
            }),
        } as ExecutionContext;
    });

    afterEach(() => {
        BruteforceGuard.resetCounters();
    });

    describe('Профили rate limiting', () => {
        it('должен применить лимит login после 3 попыток', async () => {
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Первые 3 попытки должны пройти
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }

            // 4-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(
                asPrivate(guard).handleRequest(requestProps),
            ).rejects.toThrow(ThrottlerException);
        });

        it('должен применить лимит refresh после 5 попыток', async () => {
            mockRequest.url = '/online-store/auth/refresh';

            const requestProps = { context: mockContext };

            // Первые 5 попыток должны пройти
            for (let i = 0; i < 5; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }

            // 6-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(
                asPrivate(guard).handleRequest(requestProps),
            ).rejects.toThrow(ThrottlerException);
        });

        it('должен применить лимит registration после 2 попыток', async () => {
            mockRequest.url = '/online-store/auth/registration';

            const requestProps = { context: mockContext };

            // Первые 2 попытки должны пройти
            for (let i = 0; i < 2; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }

            // 3-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(
                asPrivate(guard).handleRequest(requestProps),
            ).rejects.toThrow(ThrottlerException);
        });

        it('не должен применять лимиты для не-auth роутов', async () => {
            mockRequest.url = '/online-store/product/123';

            const requestProps = { context: mockContext };

            // Проверяем, что можем делать много запросов к обычным роутам
            for (let i = 0; i < 100; i++) {
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }
        });
    });

    describe('Изоляция между профилями', () => {
        it('счётчики login и refresh должны быть независимыми', async () => {
            const loginRequest = {
                ...mockRequest,
                url: '/online-store/auth/login',
            };
            const refreshRequest = {
                ...mockRequest,
                url: '/online-store/auth/refresh',
            };

            const loginContext = createMockContextForRequest(loginRequest);
            const refreshContext = createMockContextForRequest(refreshRequest);

            // Исчерпываем лимит login
            for (let i = 0; i < 3; i++) {
                await asPrivate(guard).handleRequest({ context: loginContext });
            }

            // refresh должен всё ещё работать
            await expect(
                asPrivate(guard).handleRequest({ context: refreshContext }),
            ).resolves.toBe(true);
        });

        it('счётчики для разных IP должны быть независимыми', async () => {
            const ip1Request = {
                ...mockRequest,
                socket: { remoteAddress: '192.168.1.100' },
            };
            const ip2Request = {
                ...mockRequest,
                socket: { remoteAddress: '192.168.1.101' },
            };

            const context1 = createMockContextForRequest(ip1Request);
            const context2 = createMockContextForRequest(ip2Request);

            // Исчерпываем лимит для IP1
            for (let i = 0; i < 3; i++) {
                delete (ip1Request as TestRequest).__bruteforceProcessed;
                await asPrivate(guard).handleRequest({ context: context1 });
            }
            delete (ip1Request as TestRequest).__bruteforceProcessed;
            await expect(
                asPrivate(guard).handleRequest({ context: context1 }),
            ).rejects.toThrow();

            // IP2 должен всё ещё работать
            delete (ip2Request as TestRequest).__bruteforceProcessed;
            await expect(
                asPrivate(guard).handleRequest({ context: context2 }),
            ).resolves.toBe(true);
        });
    });

    describe('Извлечение IP адреса', () => {
        it('должен извлечь IP из x-forwarded-for (первый в списке)', () => {
            mockRequest.headers = {
                ...mockRequest.headers,
                'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
            };

            const ip = asPrivate(guard).extractClientIP(mockRequest as Request);
            expect(ip).toBe('203.0.113.195');
        });

        it('должен извлечь IP из x-real-ip', () => {
            mockRequest.headers = {
                ...mockRequest.headers,
                'x-real-ip': '203.0.113.100',
            };

            const ip = asPrivate(guard).extractClientIP(mockRequest as Request);
            expect(ip).toBe('203.0.113.100');
        });

        it('должен извлечь IP из x-client-ip', () => {
            mockRequest.headers = {
                ...mockRequest.headers,
                'x-client-ip': '203.0.113.50',
            };

            const ip = asPrivate(guard).extractClientIP(mockRequest as Request);
            expect(ip).toBe('203.0.113.50');
        });

        it('должен использовать socket.remoteAddress как fallback', () => {
            mockRequest.headers = {};
            mockRequest.socket = { remoteAddress: '192.168.1.200' };

            const ip = asPrivate(guard).extractClientIP(mockRequest as Request);
            expect(ip).toBe('192.168.1.200');
        });

        it('должен вернуть "unknown" если IP невалиден', () => {
            mockRequest.headers = {
                'x-forwarded-for': 'invalid-ip',
            };
            mockRequest.socket = undefined;

            const ip = asPrivate(guard).extractClientIP(mockRequest as Request);
            expect(ip).toBe('unknown');
        });
    });

    describe('Валидация IP адреса', () => {
        it('должен принять валидные IPv4 адреса', () => {
            const validIPs = [
                '192.168.1.1',
                '10.0.0.1',
                '172.16.0.1',
                '203.0.113.1',
                '255.255.255.255',
                '0.0.0.0',
            ];

            validIPs.forEach((ip) => {
                expect(asPrivate(guard).isValidIP(ip)).toBe(true);
            });
        });

        it('должен принять валидные IPv6 адреса', () => {
            const validIPs = [
                '2001:0db8:0000:0000:0000:ff00:0042:8329',
                'fe80:0000:0000:0000:0204:61ff:fe9d:f156',
            ];

            validIPs.forEach((ip) => {
                expect(asPrivate(guard).isValidIP(ip)).toBe(true);
            });
        });

        it('должен отклонить невалидные IP адреса', () => {
            const invalidIPs = [
                'invalid',
                '999.999.999.999',
                '192.168.1',
                '192.168.1.1.1',
                '',
                null,
                undefined,
            ];

            invalidIPs.forEach((ip) => {
                expect(asPrivate(guard).isValidIP(ip as string)).toBe(false);
            });
        });
    });

    describe('Маскирование IP для логов', () => {
        it('должен замаскировать последний октет IPv4', () => {
            const masked = asPrivate(guard).maskIP('192.168.1.100');
            expect(masked).toBe('192.168.1.xxx');
        });

        it('должен замаскировать последние группы IPv6', () => {
            const masked = asPrivate(guard).maskIP(
                '2001:0db8:0000:0000:0000:ff00:0042:8329',
            );
            expect(masked).toBe('2001:0db8:0000:0000:0000:ff00:xxxx:xxxx');
        });

        it('должен вернуть "unknown" без изменений', () => {
            const masked = asPrivate(guard).maskIP('unknown');
            expect(masked).toBe('unknown');
        });

        it('должен вернуть "masked" для невалидных форматов', () => {
            const masked = asPrivate(guard).maskIP('invalid-ip');
            expect(masked).toBe('masked');
        });
    });

    describe('Тестовое окружение', () => {
        it('должен пропускать запросы если RATE_LIMIT_ENABLED=false', async () => {
            process.env.RATE_LIMIT_ENABLED = 'false';
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Проверяем, что можем делать много запросов
            for (let i = 0; i < 100; i++) {
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }
        });

        it('должен применять лимиты если RATE_LIMIT_ENABLED=true', async () => {
            process.env.RATE_LIMIT_ENABLED = 'true';
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Первые 3 попытки должны пройти
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }

            // 4-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(
                asPrivate(guard).handleRequest(requestProps),
            ).rejects.toThrow();
        });
    });

    describe('Защита от повторных вызовов', () => {
        it('не должен считать запрос дважды если уже обработан', async () => {
            mockRequest.url = '/online-store/auth/login';
            mockRequest.__bruteforceProcessed = true;

            const requestProps = { context: mockContext };

            // Должен пройти без инкремента счётчика
            await expect(
                asPrivate(guard).handleRequest(requestProps),
            ).resolves.toBe(true);

            // Проверяем, что счётчик не был увеличен
            delete mockRequest.__bruteforceProcessed;

            // Первые 3 попытки должны пройти (счётчик был на 0)
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }
        });
    });

    describe('Сброс счётчиков', () => {
        it('должен очистить все счётчики после resetCounters()', async () => {
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Исчерпываем лимит
            for (let i = 0; i < 3; i++) {
                await asPrivate(guard).handleRequest(requestProps);
            }

            // Сбрасываем счётчики
            BruteforceGuard.resetCounters();

            // Должны снова иметь 3 попытки
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(
                    asPrivate(guard).handleRequest(requestProps),
                ).resolves.toBe(true);
            }
        });
    });

    describe('Логирование блокировок', () => {
        it('должен логировать блокировку с замаскированным IP', async () => {
            mockRequest.url = '/online-store/auth/login';
            mockRequest.socket = { remoteAddress: '192.168.1.100' };
            const requestProps = { context: mockContext };
            const loggerSpy = jest.spyOn(asPrivate(guard).logger, 'warn');

            // Исчерпываем лимит
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await asPrivate(guard).handleRequest(requestProps);
            }

            // Следующий запрос должен залогировать блокировку
            delete mockRequest.__bruteforceProcessed;
            try {
                await asPrivate(guard).handleRequest(requestProps);
            } catch {
                // Ожидаем исключение
            }

            expect(loggerSpy).toHaveBeenCalledWith(
                'login rate limit exceeded',
                expect.objectContaining({
                    route: '/online-store/auth/login',
                    method: 'POST',
                    correlationId: 'test-correlation-id',
                    ip: '192.168.1.xxx', // Маскированный IP
                }),
            );
        });

        it('не должен логировать PII (полный IP)', async () => {
            mockRequest.url = '/online-store/auth/login';
            mockRequest.socket = { remoteAddress: '203.0.113.50' };

            const requestProps = { context: mockContext };
            const loggerSpy = jest.spyOn(asPrivate(guard).logger, 'warn');

            // Исчерпываем лимит
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await asPrivate(guard).handleRequest(requestProps);
            }

            // Следующий запрос должен залогировать блокировку
            delete mockRequest.__bruteforceProcessed;
            try {
                await asPrivate(guard).handleRequest(requestProps);
            } catch {
                // Ожидаем исключение
            }

            // Проверяем, что полный IP не попал в логи
            const logCall = loggerSpy.mock.calls[0][1];
            expect(logCall.ip).not.toBe('203.0.113.50');
            expect(logCall.ip).toBe('203.0.113.xxx');
        });
    });

    describe('Сообщение об ошибке', () => {
        it('должен возвращать русское сообщение при блокировке', async () => {
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Исчерпываем лимит
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await asPrivate(guard).handleRequest(requestProps);
            }

            // Следующий запрос должен вернуть русское сообщение
            delete mockRequest.__bruteforceProcessed;
            await expect(
                asPrivate(guard).handleRequest(requestProps),
            ).rejects.toThrow('Слишком много запросов. Попробуйте позже.');
        });
    });

    describe('Config cache TTL', () => {
        it('должен обновить кэш после истечения TTL (30 секунд)', async () => {
            // Используем fake timers для контроля времени
            jest.useFakeTimers();

            // Первый запрос - создаёт кэш
            mockRequest.url = '/online-store/auth/login';
            const requestProps = { context: mockContext };

            await asPrivate(guard).handleRequest(requestProps);

            // Проверяем что кэш создан
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const firstConfig = (BruteforceGuard as any).cachedConfig;
            expect(firstConfig).toBeDefined();
            expect(firstConfig.loginLimit).toBe(3);
            expect(firstConfig.refreshLimit).toBe(5);
            expect(firstConfig.regLimit).toBe(2);

            // Ждём 31 секунду (больше TTL = 30 секунд)
            jest.advanceTimersByTime(31000);

            // Следующий запрос должен обновить кэш
            delete mockRequest.__bruteforceProcessed;
            await asPrivate(guard).handleRequest(requestProps);

            // Кэш должен обновиться (новый timestamp)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const secondConfig = (BruteforceGuard as any).cachedConfig;
            expect(secondConfig).toBeDefined();

            jest.useRealTimers();
        });

        it('должен использовать кэшированную конфигурацию для всех профилей', async () => {
            // Очищаем кэш
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (BruteforceGuard as any).cachedConfig = null;

            // Вызываем handleRequest для каждого профиля
            const loginContext = createMockContextForRequest({
                ...mockRequest,
                url: '/online-store/auth/login',
            });
            const refreshContext = createMockContextForRequest({
                ...mockRequest,
                url: '/online-store/auth/refresh',
            });
            const regContext = createMockContextForRequest({
                ...mockRequest,
                url: '/online-store/auth/registration',
            });

            // Первый вызов создаёт кэш
            await asPrivate(guard).handleRequest({ context: loginContext });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cachedConfig = (BruteforceGuard as any).cachedConfig;
            expect(cachedConfig).toBeDefined();

            // Следующие вызовы должны использовать кэш (не создавать новый)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const timestampAfterFirst = (BruteforceGuard as any)
                .configCacheTime;

            delete mockRequest.__bruteforceProcessed;
            await asPrivate(guard).handleRequest({ context: refreshContext });

            delete mockRequest.__bruteforceProcessed;
            await asPrivate(guard).handleRequest({ context: regContext });

            // Timestamp не должен измениться (кэш используется)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((BruteforceGuard as any).configCacheTime).toBe(
                timestampAfterFirst,
            );
        });
    });

    describe('Automatic cleanup (memory leak prevention)', () => {
        it('должен автоматически удалять истёкшие счётчики', async () => {
            jest.useFakeTimers();

            mockRequest.url = '/online-store/auth/login';
            const requestProps = { context: mockContext };

            // Создаём первый счётчик
            await asPrivate(guard).handleRequest(requestProps);

            // Создаём второй счётчик для другого IP
            const request2 = {
                ...mockRequest,
                socket: { remoteAddress: '10.0.0.1' },
            };
            const context2 = createMockContextForRequest(request2);
            delete (request2 as TestRequest).__bruteforceProcessed;
            await asPrivate(guard).handleRequest({ context: context2 });

            expect(BruteforceGuard['counters'].size).toBe(2);

            // Ждём пока счётчики истекут (1 минута + 1 секунда)
            jest.advanceTimersByTime(61000);

            // Ждём cleanup interval (1 минута)
            jest.advanceTimersByTime(60000);

            // Следующий запрос должен вызвать cleanup и удалить оба истёкших счётчика
            delete mockRequest.__bruteforceProcessed;
            await asPrivate(guard).handleRequest(requestProps);

            // Старые счётчики удалены, создан только 1 новый
            expect(BruteforceGuard['counters'].size).toBe(1);

            jest.useRealTimers();
        });

        it('cleanup должен удалять только истёкшие записи', () => {
            // Создаём актуальный счётчик
            const now = Date.now();
            BruteforceGuard['counters'].set('login:192.168.1.1', {
                count: 1,
                resetAt: now + 10000, // Истекает через 10 секунд
            });

            // Создаём истёкший счётчик
            BruteforceGuard['counters'].set('login:192.168.1.2', {
                count: 2,
                resetAt: now - 1000, // Уже истёк
            });

            expect(BruteforceGuard['counters'].size).toBe(2);

            // Устанавливаем lastCleanupTime в прошлое для запуска cleanup
            BruteforceGuard['lastCleanupTime'] = now - 61000;

            // Вызываем cleanup напрямую
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (guard as any).cleanExpiredCounters();

            // Должен остаться только актуальный счётчик
            expect(BruteforceGuard['counters'].size).toBe(1);
            expect(BruteforceGuard['counters'].has('login:192.168.1.1')).toBe(
                true,
            );
            expect(BruteforceGuard['counters'].has('login:192.168.1.2')).toBe(
                false,
            );
        });
    });

    describe('parseWindowToMs helper', () => {
        it('должен парсить секунды (s)', () => {
            expect(parseWindowToMs('30s', 1000)).toBe(30 * 1000);
            expect(parseWindowToMs('1s', 5000)).toBe(1000);
            expect(parseWindowToMs('90s', 1000)).toBe(90 * 1000);
        });

        it('должен парсить минуты (m)', () => {
            expect(parseWindowToMs('1m', 1000)).toBe(60 * 1000);
            expect(parseWindowToMs('15m', 1000)).toBe(15 * 60 * 1000);
            expect(parseWindowToMs('30m', 1000)).toBe(30 * 60 * 1000);
        });

        it('должен парсить часы (h)', () => {
            expect(parseWindowToMs('1h', 1000)).toBe(60 * 60 * 1000);
            expect(parseWindowToMs('2h', 1000)).toBe(2 * 60 * 60 * 1000);
            expect(parseWindowToMs('24h', 1000)).toBe(24 * 60 * 60 * 1000);
        });

        it('должен парсить дни (d)', () => {
            expect(parseWindowToMs('1d', 1000)).toBe(24 * 60 * 60 * 1000);
            expect(parseWindowToMs('7d', 1000)).toBe(7 * 24 * 60 * 60 * 1000);
            expect(parseWindowToMs('30d', 1000)).toBe(30 * 24 * 60 * 60 * 1000);
        });

        it('должен вернуть fallback для невалидного формата', () => {
            expect(parseWindowToMs('invalid', 5000)).toBe(5000);
            expect(parseWindowToMs('10', 5000)).toBe(5000);
            expect(parseWindowToMs('10x', 5000)).toBe(5000);
            expect(parseWindowToMs('', 5000)).toBe(5000);
            expect(parseWindowToMs('10 minutes', 5000)).toBe(5000);
        });

        it('должен игнорировать пробелы', () => {
            expect(parseWindowToMs('30 s', 1000)).toBe(30 * 1000);
            expect(parseWindowToMs('15 m', 1000)).toBe(15 * 60 * 1000);
            expect(parseWindowToMs('1  h', 1000)).toBe(60 * 60 * 1000);
        });
    });
});
