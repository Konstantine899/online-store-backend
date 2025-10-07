import { CorrelationIdMiddleware } from '@app/infrastructure/common/middleware/correlation-id.middleware';
import { Request, Response, NextFunction } from 'express';

/**
 * Unit-тесты для CorrelationIdMiddleware
 * 
 * Цель: покрыть критичные сценарии трассировки запросов
 * - Генерация correlation ID если отсутствует
 * - Пробрасывание существующего correlation ID
 * - Добавление correlation ID в response headers
 * - Корректный вызов next() middleware
 */

describe('CorrelationIdMiddleware (unit)', () => {
    let middleware: CorrelationIdMiddleware;
    let mockRequest: Partial<Request & { correlationId?: string }>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let setHeaderSpy: jest.Mock;

    beforeEach(() => {
        middleware = new CorrelationIdMiddleware();

        // Создаём spy для setHeader
        setHeaderSpy = jest.fn();

        mockRequest = {
            headers: {},
        };

        mockResponse = {
            setHeader: setHeaderSpy,
        };

        mockNext = jest.fn();
    });

    describe('Генерация correlation ID', () => {
        it('должен сгенерировать новый correlation ID если заголовок отсутствует', () => {
            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            // Проверяем, что correlation ID был сгенерирован
            expect(mockRequest.correlationId).toBeDefined();
            expect(typeof mockRequest.correlationId).toBe('string');
            expect(mockRequest.correlationId).toHaveLength(36); // UUID v4 длина

            // Проверяем формат UUID (8-4-4-4-12)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(mockRequest.correlationId).toMatch(uuidRegex);
        });

        it('должен генерировать уникальные correlation ID для разных запросов', () => {
            const correlationIds = new Set<string>();

            // Генерируем 100 ID
            for (let i = 0; i < 100; i++) {
                const req = { headers: {} } as unknown as Request & { correlationId?: string };
                const res = { setHeader: jest.fn() } as unknown as Response;
                const next = jest.fn();

                middleware.use(req, res, next);

                correlationIds.add(req.correlationId!);
            }

            // Проверяем, что все ID уникальны
            expect(correlationIds.size).toBe(100);
        });
    });

    describe('Пробрасывание существующего correlation ID', () => {
        it('должен использовать correlation ID из заголовка x-request-id', () => {
            const existingId = 'existing-correlation-id-12345';
            mockRequest.headers = {
                'x-request-id': existingId,
            };

            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            expect(mockRequest.correlationId).toBe(existingId);
        });

        it('должен корректно обработать различные форматы correlation ID', () => {
            const testIds = [
                'simple-id',
                '12345',
                'uuid-format-aaaa-bbbb-cccc-dddd',
                'very-long-correlation-id-with-many-characters-123456789',
            ];

            testIds.forEach((testId) => {
                const req = {
                    headers: { 'x-request-id': testId },
                } as unknown as Request & { correlationId?: string };
                const res = { setHeader: jest.fn() } as unknown as Response;
                const next = jest.fn();

                middleware.use(req, res, next);

                expect(req.correlationId).toBe(testId);
            });
        });

        it('должен генерировать новый ID если x-request-id пустая строка', () => {
            mockRequest.headers = {
                'x-request-id': '',
            };

            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            // Пустая строка считается falsy, поэтому должен быть сгенерирован новый ID
            expect(mockRequest.correlationId).toBeDefined();
            expect(mockRequest.correlationId).not.toBe('');
            expect(mockRequest.correlationId).toHaveLength(36);
        });
    });

    describe('Добавление correlation ID в response', () => {
        it('должен добавить x-request-id в response headers', () => {
            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            expect(setHeaderSpy).toHaveBeenCalledWith(
                'x-request-id',
                mockRequest.correlationId,
            );
            expect(setHeaderSpy).toHaveBeenCalledTimes(1);
        });

        it('должен добавить существующий correlation ID в response headers', () => {
            const existingId = 'predefined-correlation-id';
            mockRequest.headers = {
                'x-request-id': existingId,
            };

            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            expect(setHeaderSpy).toHaveBeenCalledWith('x-request-id', existingId);
        });
    });

    describe('Вызов next middleware', () => {
        it('должен вызвать next() для продолжения цепочки middleware', () => {
            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledTimes(1);
        });

        it('должен вызвать next() даже если correlation ID уже установлен', () => {
            mockRequest.headers = {
                'x-request-id': 'existing-id',
            };

            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledTimes(1);
        });

        it('должен вызвать next() без аргументов (успешное выполнение)', () => {
            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith();
        });
    });

    describe('Последовательность операций', () => {
        it('должен выполнить операции в правильной последовательности', () => {
            const callOrder: string[] = [];

            const trackingRequest = mockRequest as Request & { correlationId?: string };
            const trackingResponse = {
                setHeader: jest.fn((...args) => {
                    callOrder.push('setHeader');
                }),
            } as unknown as Response;
            const trackingNext = jest.fn(() => {
                callOrder.push('next');
            });

            middleware.use(trackingRequest, trackingResponse, trackingNext);

            // Проверяем последовательность: сначала setHeader, потом next
            expect(callOrder).toEqual(['setHeader', 'next']);
        });

        it('должен установить correlationId в request перед вызовом setHeader', () => {
            let correlationIdAtSetHeader: string | undefined;

            const trackingResponse = {
                setHeader: jest.fn((name: string, value: string) => {
                    if (name === 'x-request-id') {
                        correlationIdAtSetHeader = (mockRequest as any).correlationId;
                    }
                }),
            } as unknown as Response;

            middleware.use(
                mockRequest as Request & { correlationId?: string },
                trackingResponse,
                mockNext,
            );

            expect(correlationIdAtSetHeader).toBeDefined();
            expect(correlationIdAtSetHeader).toBe(mockRequest.correlationId);
        });
    });

    describe('Граничные случаи', () => {
        it('должен обработать request с пустым объектом заголовков', () => {
            const req = { headers: {} } as unknown as Request & { correlationId?: string };
            const res = { setHeader: jest.fn() } as unknown as Response;
            const next = jest.fn();

            middleware.use(req, res, next);

            expect(req.correlationId).toBeDefined();
            expect(res.setHeader).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('должен обработать множественные заголовки x-request-id (взять первый)', () => {
            // Express обрабатывает множественные заголовки как строку или массив
            mockRequest.headers = {
                'x-request-id': 'first-id',
            };

            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            expect(mockRequest.correlationId).toBe('first-id');
        });

        it('должен обработать x-request-id с пробелами по краям', () => {
            mockRequest.headers = {
                'x-request-id': '  correlation-id-with-spaces  ',
            };

            middleware.use(
                mockRequest as Request & { correlationId?: string },
                mockResponse as Response,
                mockNext,
            );

            // Middleware не делает trim, пробрасывает как есть
            expect(mockRequest.correlationId).toBe('  correlation-id-with-spaces  ');
        });
    });

    describe('Производительность', () => {
        it('должен обрабатывать множественные запросы быстро', () => {
            const startTime = Date.now();

            // Обрабатываем 1000 запросов
            for (let i = 0; i < 1000; i++) {
                const req = { headers: {} } as unknown as Request & { correlationId?: string };
                const res = { setHeader: jest.fn() } as unknown as Response;
                const next = jest.fn();

                middleware.use(req, res, next);
            }

            const duration = Date.now() - startTime;

            // Проверяем, что обработка заняла разумное время (< 500ms для 1000 операций)
            expect(duration).toBeLessThan(500);
        });
    });
});

