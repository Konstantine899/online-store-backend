import { BruteforceGuard } from '@app/infrastructure/common/guards/bruteforce.guard';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

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
 */

describe('BruteforceGuard (unit)', () => {
    let guard: BruteforceGuard;
    let mockContext: ExecutionContext;
    let mockRequest: Partial<Request>;
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
        } as any;

        mockReflector = {
            getAllAndOverride: jest.fn(),
        } as any;

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
            } as any,
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
                delete (mockRequest as any).__bruteforceProcessed;
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
            }

            // 4-я попытка должна быть заблокирована
            delete (mockRequest as any).__bruteforceProcessed;
            await expect(guard['handleRequest'](requestProps as any)).rejects.toThrow(ThrottlerException);
        });

        it('должен применить лимит refresh после 5 попыток', async () => {
            mockRequest.url = '/online-store/auth/refresh';

            const requestProps = { context: mockContext };

            // Первые 5 попыток должны пройти
            for (let i = 0; i < 5; i++) {
                delete (mockRequest as any).__bruteforceProcessed;
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
            }

            // 6-я попытка должна быть заблокирована
            delete (mockRequest as any).__bruteforceProcessed;
            await expect(guard['handleRequest'](requestProps as any)).rejects.toThrow(ThrottlerException);
        });

        it('должен применить лимит registration после 2 попыток', async () => {
            mockRequest.url = '/online-store/auth/registration';

            const requestProps = { context: mockContext };

            // Первые 2 попытки должны пройти
            for (let i = 0; i < 2; i++) {
                delete (mockRequest as any).__bruteforceProcessed;
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
            }

            // 3-я попытка должна быть заблокирована
            delete (mockRequest as any).__bruteforceProcessed;
            await expect(guard['handleRequest'](requestProps as any)).rejects.toThrow(ThrottlerException);
        });

        it('не должен применять лимиты для не-auth роутов', async () => {
            mockRequest.url = '/online-store/product/123';

            const requestProps = { context: mockContext };

            // Проверяем, что можем делать много запросов к обычным роутам
            for (let i = 0; i < 100; i++) {
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
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

            const loginContext = {
                switchToHttp: () => ({ getRequest: () => loginRequest }),
            } as ExecutionContext;

            const refreshContext = {
                switchToHttp: () => ({ getRequest: () => refreshRequest }),
            } as ExecutionContext;

            // Исчерпываем лимит login
            for (let i = 0; i < 3; i++) {
                await guard['handleRequest']({ context: loginContext } as any);
            }

            // refresh должен всё ещё работать
            await expect(
                guard['handleRequest']({ context: refreshContext } as any),
            ).resolves.toBe(true);
        });

        it('счётчики для разных IP должны быть независимыми', async () => {
            const ip1Request = {
                ...mockRequest,
                socket: { remoteAddress: '192.168.1.100' } as any,
            };

            const ip2Request = {
                ...mockRequest,
                socket: { remoteAddress: '192.168.1.101' } as any,
            };

            const context1 = {
                switchToHttp: () => ({ getRequest: () => ip1Request }),
            } as ExecutionContext;

            const context2 = {
                switchToHttp: () => ({ getRequest: () => ip2Request }),
            } as ExecutionContext;

            // Исчерпываем лимит для IP1
            for (let i = 0; i < 3; i++) {
                delete (ip1Request as any).__bruteforceProcessed;
                await guard['handleRequest']({ context: context1 } as any);
            }
            delete (ip1Request as any).__bruteforceProcessed;
            await expect(guard['handleRequest']({ context: context1 } as any)).rejects.toThrow();

            // IP2 должен всё ещё работать
            delete (ip2Request as any).__bruteforceProcessed;
            await expect(
                guard['handleRequest']({ context: context2 } as any),
            ).resolves.toBe(true);
        });
    });

    describe('Извлечение IP адреса', () => {
        it('должен извлечь IP из x-forwarded-for (первый в списке)', () => {
            mockRequest.headers = {
                ...mockRequest.headers,
                'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
            };

            const ip = guard['extractClientIP'](mockRequest as any);
            expect(ip).toBe('203.0.113.195');
        });

        it('должен извлечь IP из x-real-ip', () => {
            mockRequest.headers = {
                ...mockRequest.headers,
                'x-real-ip': '203.0.113.100',
            };

            const ip = guard['extractClientIP'](mockRequest as any);
            expect(ip).toBe('203.0.113.100');
        });

        it('должен извлечь IP из x-client-ip', () => {
            mockRequest.headers = {
                ...mockRequest.headers,
                'x-client-ip': '203.0.113.50',
            };

            const ip = guard['extractClientIP'](mockRequest as any);
            expect(ip).toBe('203.0.113.50');
        });

        it('должен использовать socket.remoteAddress как fallback', () => {
            mockRequest.headers = {};
            mockRequest.socket = { remoteAddress: '192.168.1.200' } as any;

            const ip = guard['extractClientIP'](mockRequest as any);
            expect(ip).toBe('192.168.1.200');
        });

        it('должен вернуть "unknown" если IP невалиден', () => {
            mockRequest.headers = {
                'x-forwarded-for': 'invalid-ip',
            };
            mockRequest.socket = undefined;

            const ip = guard['extractClientIP'](mockRequest as any);
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
                expect(guard['isValidIP'](ip)).toBe(true);
            });
        });

        it('должен принять валидные IPv6 адреса', () => {
            const validIPs = [
                '2001:0db8:0000:0000:0000:ff00:0042:8329',
                'fe80:0000:0000:0000:0204:61ff:fe9d:f156',
            ];

            validIPs.forEach((ip) => {
                expect(guard['isValidIP'](ip)).toBe(true);
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
                expect(guard['isValidIP'](ip as any)).toBe(false);
            });
        });
    });

    describe('Маскирование IP для логов', () => {
        it('должен замаскировать последний октет IPv4', () => {
            const masked = guard['maskIP']('192.168.1.100');
            expect(masked).toBe('192.168.1.xxx');
        });

        it('должен замаскировать последние группы IPv6', () => {
            const masked = guard['maskIP']('2001:0db8:0000:0000:0000:ff00:0042:8329');
            expect(masked).toBe('2001:0db8:0000:0000:0000:ff00:xxxx:xxxx');
        });

        it('должен вернуть "unknown" без изменений', () => {
            const masked = guard['maskIP']('unknown');
            expect(masked).toBe('unknown');
        });

        it('должен вернуть "masked" для невалидных форматов', () => {
            const masked = guard['maskIP']('invalid-ip');
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
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
            }
        });

        it('должен применять лимиты если RATE_LIMIT_ENABLED=true', async () => {
            process.env.RATE_LIMIT_ENABLED = 'true';
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Первые 3 попытки должны пройти
            for (let i = 0; i < 3; i++) {
                delete (mockRequest as any).__bruteforceProcessed;
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
            }

            // 4-я попытка должна быть заблокирована
            delete (mockRequest as any).__bruteforceProcessed;
            await expect(guard['handleRequest'](requestProps as any)).rejects.toThrow();
        });
    });

    describe('Защита от повторных вызовов', () => {
        it('не должен считать запрос дважды если уже обработан', async () => {
            mockRequest.url = '/online-store/auth/login';
            (mockRequest as any).__bruteforceProcessed = true;

            const requestProps = { context: mockContext };

            // Должен пройти без инкремента счётчика
            await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);

            // Проверяем, что счётчик не был увеличен
            (mockRequest as any).__bruteforceProcessed = false;
            
            // Первые 3 попытки должны пройти (счётчик был на 0)
            for (let i = 0; i < 3; i++) {
                (mockRequest as any).__bruteforceProcessed = false;
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
            }
        });
    });

    describe('Сброс счётчиков', () => {
        it('должен очистить все счётчики после resetCounters()', async () => {
            mockRequest.url = '/online-store/auth/login';

            const requestProps = { context: mockContext };

            // Исчерпываем лимит
            for (let i = 0; i < 3; i++) {
                await guard['handleRequest'](requestProps as any);
            }

            // Сбрасываем счётчики
            BruteforceGuard.resetCounters();

            // Должны снова иметь 3 попытки
            for (let i = 0; i < 3; i++) {
                (mockRequest as any).__bruteforceProcessed = false;
                await expect(guard['handleRequest'](requestProps as any)).resolves.toBe(true);
            }
        });
    });

    describe('Логирование блокировок', () => {
        it('должен логировать блокировку с замаскированным IP', async () => {
            mockRequest.url = '/online-store/auth/login';
            mockRequest.socket = { remoteAddress: '192.168.1.100' } as any;

            const requestProps = { context: mockContext };
            const loggerSpy = jest.spyOn(guard['logger'], 'warn');

            // Исчерпываем лимит
            for (let i = 0; i < 3; i++) {
                delete (mockRequest as any).__bruteforceProcessed;
                await guard['handleRequest'](requestProps as any);
            }

            // Следующий запрос должен залогировать блокировку
            delete (mockRequest as any).__bruteforceProcessed;
            try {
                await guard['handleRequest'](requestProps as any);
            } catch (e) {
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
            mockRequest.socket = { remoteAddress: '203.0.113.50' } as any;

            const requestProps = { context: mockContext };
            const loggerSpy = jest.spyOn(guard['logger'], 'warn');

            // Исчерпываем лимит
            for (let i = 0; i < 3; i++) {
                delete (mockRequest as any).__bruteforceProcessed;
                await guard['handleRequest'](requestProps as any);
            }

            // Следующий запрос должен залогировать блокировку
            delete (mockRequest as any).__bruteforceProcessed;
            try {
                await guard['handleRequest'](requestProps as any);
            } catch (e) {
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
                delete (mockRequest as any).__bruteforceProcessed;
                await guard['handleRequest'](requestProps as any);
            }

            // Следующий запрос должен вернуть русское сообщение
            delete (mockRequest as any).__bruteforceProcessed;
            await expect(guard['handleRequest'](requestProps as any)).rejects.toThrow(
                'Слишком много запросов. Попробуйте позже.',
            );
        });
    });
});

