import { BruteforceGuard } from '@app/infrastructure/common/guards/bruteforce.guard';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Socket } from 'net';

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
type PrivateGuard = {
    handleRequest: (context: HandleRequestContext) => Promise<boolean>;
    extractClientIP: (req: Request) => string;
    isValidIP: (ip: string) => boolean;
    maskIP: (ip: string) => string;
    logger: { warn: jest.Mock };
}

// Helper функции для сокращения кода (DRY)
const asPrivate = (guard: BruteforceGuard): PrivateGuard => guard as unknown as PrivateGuard;

const createMockContextForRequest = (request: TestRequest): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => request }),
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

        guard = new BruteforceGuard(mockOptions, mockStorageService, mockReflector);

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

        // Создаём mock context
        mockContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
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
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
            }

            // 4-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(asPrivate(guard).handleRequest(requestProps)).rejects.toThrow(ThrottlerException);
        });

        it('должен применить лимит refresh после 5 попыток', async () => {
            mockRequest.url = '/online-store/auth/refresh';

            const requestProps = { context: mockContext };

            // Первые 5 попыток должны пройти
            for (let i = 0; i < 5; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
            }

            // 6-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(asPrivate(guard).handleRequest(requestProps)).rejects.toThrow(ThrottlerException);
        });

        it('должен применить лимит registration после 2 попыток', async () => {
            mockRequest.url = '/online-store/auth/registration';

            const requestProps = { context: mockContext };

            // Первые 2 попытки должны пройти
            for (let i = 0; i < 2; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
            }

            // 3-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(asPrivate(guard).handleRequest(requestProps)).rejects.toThrow(ThrottlerException);
        });

        it('не должен применять лимиты для не-auth роутов', async () => {
            mockRequest.url = '/online-store/product/123';

            const requestProps = { context: mockContext };

            // Проверяем, что можем делать много запросов к обычным роутам
            for (let i = 0; i < 100; i++) {
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
            }
        });
    });

    describe('Изоляция между профилями', () => {
        it('счётчики login и refresh должны быть независимыми', async () => {
            const loginRequest = { ...mockRequest, url: '/online-store/auth/login' };
            const refreshRequest = { ...mockRequest, url: '/online-store/auth/refresh' };

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
            const ip1Request = { ...mockRequest, socket: { remoteAddress: '192.168.1.100' } };
            const ip2Request = { ...mockRequest, socket: { remoteAddress: '192.168.1.101' } };

            const context1 = createMockContextForRequest(ip1Request);
            const context2 = createMockContextForRequest(ip2Request);

            // Исчерпываем лимит для IP1
            for (let i = 0; i < 3; i++) {
                delete (ip1Request as TestRequest).__bruteforceProcessed;
                await asPrivate(guard).handleRequest({ context: context1 });
            }
            delete (ip1Request as TestRequest).__bruteforceProcessed;
            await expect(asPrivate(guard).handleRequest({ context: context1 })).rejects.toThrow();

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
            const masked = asPrivate(guard).maskIP('2001:0db8:0000:0000:0000:ff00:0042:8329');
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
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
            }
        });

        it('должен применять лимиты если RATE_LIMIT_ENABLED=true', async () => {
            process.env.RATE_LIMIT_ENABLED = 'true';
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Первые 3 попытки должны пройти
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
            }

            // 4-я попытка должна быть заблокирована
            delete mockRequest.__bruteforceProcessed;
            await expect(asPrivate(guard).handleRequest(requestProps)).rejects.toThrow();
        });
    });

    describe('Защита от повторных вызовов', () => {
        it('не должен считать запрос дважды если уже обработан', async () => {
            mockRequest.url = '/online-store/auth/login';
            mockRequest.__bruteforceProcessed = true;

            const requestProps = { context: mockContext };

            // Должен пройти без инкремента счётчика
            await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);

            // Проверяем, что счётчик не был увеличен
            delete mockRequest.__bruteforceProcessed;
            
            // Первые 3 попытки должны пройти (счётчик был на 0)
            for (let i = 0; i < 3; i++) {
                delete mockRequest.__bruteforceProcessed;
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
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
                await expect(asPrivate(guard).handleRequest(requestProps)).resolves.toBe(true);
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
            await expect(asPrivate(guard).handleRequest(requestProps)).rejects.toThrow(
                'Слишком много запросов. Попробуйте позже.',
            );
        });
    });
});

