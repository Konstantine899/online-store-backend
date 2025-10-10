import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
    AccessDeniedError,
    ConnectionError,
    ConnectionRefusedError,
    DatabaseError,
    ForeignKeyConstraintError,
    TimeoutError,
    ValidationError,
} from 'sequelize';
import { SequelizeDatabaseErrorExceptionFilter } from '../sequelize-database-error.exception.filter';

/**
 * TEST-031: SequelizeDatabaseErrorExceptionFilter Unit Tests
 *
 * Coverage goal: ≥75% для exception filters
 */

describe('SequelizeDatabaseErrorExceptionFilter', () => {
    let filter: SequelizeDatabaseErrorExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;
    let mockRequest: {
        url: string;
        path: string;
        headers: Record<string, string>;
    };
    let mockResponse: { status: jest.Mock; json: jest.Mock };

    beforeEach(() => {
        filter = new SequelizeDatabaseErrorExceptionFilter();

        mockRequest = {
            url: '/online-store/user/create',
            path: '/user/create',
            headers: {
                'x-request-id': 'test-correlation-id-123',
            },
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue(mockRequest),
                getResponse: jest.fn().mockReturnValue(mockResponse),
            }),
        } as unknown as ArgumentsHost;
    });

    describe('Timeout Errors', () => {
        it('должен вернуть 400 с русским сообщением для TimeoutError', () => {
            const exception = new TimeoutError(
                Object.assign(new Error('Query execution exceeded timeout'), {
                    sql: '',
                }),
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: expect.stringContaining(
                        'Превышено время ожидания операции с базой данных',
                    ),
                }),
            );
        });

        it('должен включать timestamp для TimeoutError', () => {
            const exception = new TimeoutError(
                Object.assign(new Error('timeout'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    timestamp: expect.any(String),
                }),
            );
        });
    });

    describe('Connection Errors', () => {
        it('должен вернуть русское сообщение для ConnectionRefusedError', () => {
            const exception = Object.assign(
                new ConnectionRefusedError(
                    Object.assign(new Error('ECONNREFUSED'), { sql: '' }),
                ),
                { sql: '', parameters: {} },
            ) as DatabaseError;

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(
                        'Отказ в подключении к базе данных',
                    ),
                }),
            );
        });

        it('должен вернуть русское сообщение для AccessDeniedError', () => {
            const exception = Object.assign(
                new AccessDeniedError(
                    Object.assign(new Error('Access denied'), { sql: '' }),
                ),
                { sql: '', parameters: {} },
            ) as DatabaseError;

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(
                        'Доступ к базе данных запрещен',
                    ),
                }),
            );
        });

        it('должен вернуть русское сообщение для ConnectionError', () => {
            const exception = Object.assign(
                new ConnectionError(
                    Object.assign(new Error('Connection failed'), { sql: '' }),
                ),
                { sql: '', parameters: {} },
            ) as DatabaseError;

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(
                        'Ошибка подключения к базе данных',
                    ),
                }),
            );
        });
    });

    describe('Constraint Errors', () => {
        it('должен вернуть русское сообщение для ForeignKeyConstraintError', () => {
            const exception = Object.assign(
                new ForeignKeyConstraintError(
                    Object.assign(new Error('FK constraint failed'), {
                        sql: '',
                    }),
                ),
                { sql: '', parameters: {} },
            ) as DatabaseError;

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(
                        'Нарушение внешнего ключа',
                    ),
                }),
            );
        });

        it('должен вернуть русское сообщение для ValidationError', () => {
            const exception = Object.assign(
                new ValidationError('Validation failed', []),
                { sql: '', parameters: {} },
            ) as unknown as DatabaseError;

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Ошибка валидации данных'),
                }),
            );
        });
    });

    describe('Generic Database Error', () => {
        it('должен вернуть generic сообщение для неизвестной ошибки', () => {
            const exception = new DatabaseError(
                Object.assign(new Error('Unknown database error'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Ошибка базы данных'),
                }),
            );
        });

        it('должен включать url и path в response', () => {
            const exception = new DatabaseError(
                Object.assign(new Error('DB Error'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: '/online-store/user/create',
                    path: '/user/create',
                }),
            );
        });

        it('должен включать type и name в response', () => {
            const exception = new DatabaseError(
                Object.assign(new Error('Test error'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: expect.any(String),
                    name: expect.any(String),
                }),
            );
        });

        it('должен включать timestamp', () => {
            const exception = new DatabaseError(
                Object.assign(new Error('Error'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            const callArg = mockResponse.json.mock.calls[0][0];
            expect(callArg.timestamp).toBeDefined();
            expect(new Date(callArg.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('Logging', () => {
        it('должен обрабатывать ошибку и возвращать response', () => {
            const exception = new DatabaseError(
                Object.assign(new Error('Test'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            // Verify response contains all required fields
            expect(mockResponse.json).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
        });

        it('должен обрабатывать TimeoutError корректно', () => {
            const exception = new TimeoutError(
                Object.assign(new Error('Timeout occurred'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            // Verify filter processes the error with correct status
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(
                        'Превышено время ожидания',
                    ),
                }),
            );
        });
    });

    describe('Response Structure', () => {
        it('должен возвращать корректную структуру response', () => {
            const exception = new DatabaseError(
                Object.assign(new Error('Test'), { sql: '' }),
            );

            filter.catch(exception, mockArgumentsHost);

            const response = mockResponse.json.mock.calls[0][0];

            expect(response).toHaveProperty('statusCode');
            expect(response).toHaveProperty('url');
            expect(response).toHaveProperty('path');
            expect(response).toHaveProperty('type');
            expect(response).toHaveProperty('name');
            expect(response).toHaveProperty('message');
            expect(response).toHaveProperty('timestamp');
        });

        it('должен всегда возвращать 400 status code', () => {
            const exceptions: DatabaseError[] = [
                Object.assign(
                    new TimeoutError(
                        Object.assign(new Error('timeout'), { sql: '' }),
                    ),
                    { sql: '', parameters: {} },
                ) as DatabaseError,
                Object.assign(
                    new ConnectionError(
                        Object.assign(new Error('connection'), { sql: '' }),
                    ),
                    { sql: '', parameters: {} },
                ) as DatabaseError,
                new DatabaseError(
                    Object.assign(new Error('generic'), { sql: '' }),
                ),
            ];

            exceptions.forEach((exception) => {
                filter.catch(exception, mockArgumentsHost);
            });

            expect(mockResponse.status).toHaveBeenCalledTimes(3);
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
        });
    });
});
