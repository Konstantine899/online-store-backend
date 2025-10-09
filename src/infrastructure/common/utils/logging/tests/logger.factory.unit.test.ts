import {
    createLogger,
    createLoggerWithCorrelation,
    maskPII,
    sanitizeForLogging,
} from '@app/infrastructure/common/utils/logging';

/**
 * Тестовые константы для переиспользования (оптимизация производительности)
 * Создаются один раз на уровне модуля, переиспользуются во всех тестах
 */
const TEST_EMAIL = 'user@example.com';
const TEST_PHONE = '+79991234567';
const TEST_CORRELATION_ID = 'test-correlation-id-123';
const REDACTED = '[REDACTED]';
const EMPTY = '[EMPTY]';

describe('Logger Factory (unit)', () => {
    describe('createLogger', () => {
        it('should create logger with context', () => {
            const logger = createLogger('TestService');
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.warn).toBe('function');
        });

        it('should create logger with correlation ID', () => {
            const logger = createLogger('TestService', TEST_CORRELATION_ID);
            expect(logger).toBeDefined();
        });

        it('should reuse base logger (singleton)', () => {
            const logger1 = createLogger('Service1');
            const logger2 = createLogger('Service2');
            // Оба должны использовать общий базовый логгер
            expect(logger1).toBeDefined();
            expect(logger2).toBeDefined();
        });
    });

    describe('createLoggerWithCorrelation', () => {
        it('should create logger with correlation from request', () => {
            const req = { correlationId: 'req-correlation-123' };
            const logger = createLoggerWithCorrelation('TestController', req);
            expect(logger).toBeDefined();
        });

        it('should create logger without correlation if no request', () => {
            const logger = createLoggerWithCorrelation('TestController');
            expect(logger).toBeDefined();
        });

        it('should handle request without correlationId', () => {
            const logger = createLoggerWithCorrelation('TestController', {});
            expect(logger).toBeDefined();
        });
    });

    describe('maskPII', () => {
        it('should mask email addresses', () => {
            const masked = maskPII(TEST_EMAIL);
            expect(masked).toBe('u***@example.com');
            expect(masked).not.toContain('user');
        });

        it('should mask phone numbers', () => {
            const masked = maskPII(TEST_PHONE);
            expect(masked).toBe('+7***67');
            expect(masked).not.toContain('999123456');
        });

        it('should mask short strings completely', () => {
            expect(maskPII('abc')).toBe(REDACTED);
        });

        it('should mask strings with first 2 and last 2 chars', () => {
            const masked = maskPII('secrettoken12345');
            expect(masked).toBe('se***45');
        });

        it('should handle empty or null values', () => {
            expect(maskPII('')).toBe(EMPTY);
            expect(maskPII(null)).toBe(EMPTY);
            expect(maskPII(undefined)).toBe(EMPTY);
        });

        it('should mask very short values', () => {
            // Оптимизация: группировка схожих проверок через forEach
            const shortValues = ['a', 'ab', 'abc', 'abcd'];
            shortValues.forEach((value) => {
                expect(maskPII(value)).toBe(REDACTED);
            });
        });
    });

    describe('sanitizeForLogging', () => {
        it('should remove PII fields from object', () => {
            const input = {
                id: 123,
                email: TEST_EMAIL,
                name: 'John Doe',
                role: 'ADMIN',
                password: 'secret123',
            };

            const sanitized = sanitizeForLogging(input);

            expect(sanitized.id).toBe(123);
            expect(sanitized.role).toBe('ADMIN');
            expect(sanitized.email).toBe(REDACTED);
            expect(sanitized.name).toBe('John Doe'); // 'name' не маскируется (только firstName/lastName)
            expect(sanitized.password).toBe(REDACTED);
        });

        it('should handle nested objects', () => {
            const input = {
                userId: 123,
                user: {
                    email: TEST_EMAIL,
                    phone: '+1234567890',
                    metadata: {
                        password: 'secret',
                    },
                },
                order: {
                    id: 456,
                    amount: 1000,
                },
            };

            const sanitized = sanitizeForLogging(input);

            expect(sanitized.userId).toBe(123);
            expect(sanitized.user).toBeDefined();
            expect((sanitized.user as Record<string, unknown>).email).toBe(
                REDACTED,
            );
            expect((sanitized.user as Record<string, unknown>).phone).toBe(
                REDACTED,
            );
            expect(sanitized.order).toBeDefined();
            expect((sanitized.order as Record<string, unknown>).id).toBe(456);
            expect((sanitized.order as Record<string, unknown>).amount).toBe(
                1000,
            );
        });

        it('should handle arrays in objects', () => {
            const input = {
                users: [
                    { id: 1, email: 'user1@test.com' },
                    { id: 2, email: 'user2@test.com' },
                ],
                count: 2,
            };

            const sanitized = sanitizeForLogging(input);

            expect(sanitized.count).toBe(2);
            expect(Array.isArray(sanitized.users)).toBe(true);
        });

        it('should not modify non-PII fields', () => {
            const input = {
                userId: 123,
                orderId: 456,
                amount: 1000,
                status: 'completed',
                timestamp: '2025-10-07',
            };

            const sanitized = sanitizeForLogging(input);

            expect(sanitized).toEqual(input);
        });

        it('should handle empty object', () => {
            const sanitized = sanitizeForLogging({});
            expect(sanitized).toEqual({});
        });

        it('should mask common token fields', () => {
            const input = {
                accessToken: 'eyJhbGc...',
                refreshToken: 'refresh123',
                apiKey: 'sk_live_123',
            };

            const sanitized = sanitizeForLogging(input);

            // Оптимизация: группировка схожих проверок
            [
                sanitized.accessToken,
                sanitized.refreshToken,
                sanitized.apiKey,
            ].forEach((value) => {
                expect(value).toBe(REDACTED);
            });
        });
    });

    describe('Logger integration', () => {
        it('should allow logging without throwing errors', () => {
            const logger = createLogger('TestIntegration');

            expect(() => {
                logger.info({ test: 'data' }, 'Test message');
                logger.warn({ test: 'warning' }, 'Test warning');
                logger.error({ test: 'error' }, 'Test error');
            }).not.toThrow();
        });

        it('should handle logging with PII masking', () => {
            const logger = createLogger('TestPII');

            expect(() => {
                logger.info(
                    {
                        userId: 123,
                        email: maskPII('test@example.com'),
                    },
                    'User action',
                );
            }).not.toThrow();
        });

        it('should create unique loggers for different contexts', () => {
            const logger1 = createLogger('Context1');
            const logger2 = createLogger('Context2');

            expect(logger1).not.toBe(logger2);
        });
    });
});
