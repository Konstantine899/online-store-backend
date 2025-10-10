import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';
import { SequelizeUniqueConstraintExceptionFilter } from '../sequelize-unique-constraint.exception.filter';

/**
 * TEST-031: SequelizeUniqueConstraintExceptionFilter Unit Tests
 *
 * Coverage goal: ≥75% для exception filters
 */

describe('SequelizeUniqueConstraintExceptionFilter', () => {
    let filter: SequelizeUniqueConstraintExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;
    let mockRequest: {
        url: string;
        path: string;
        headers: Record<string, string>;
    };
    let mockResponse: { status: jest.Mock; json: jest.Mock };

    beforeEach(() => {
        filter = new SequelizeUniqueConstraintExceptionFilter();

        mockRequest = {
            url: '/online-store/user',
            path: '/user',
            headers: {
                'x-request-id': 'test-correlation-unique-123',
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

    it('должен вернуть 409 Conflict для unique constraint violation', () => {
        const exception = new UniqueConstraintError({
            errors: [
                {
                    path: 'email',
                    value: 'duplicate@example.com',
                    message: 'email must be unique',
                } as ValidationErrorItem,
            ],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('должен возвращать field-specific русские сообщения', () => {
        const exception = new UniqueConstraintError({
            errors: [
                {
                    path: 'email',
                    value: 'test@example.com',
                    message: 'must be unique',
                } as ValidationErrorItem,
            ],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.arrayContaining([
                    'Значение поля "email" уже используется',
                ]),
            }),
        );
    });

    it('должен обрабатывать multiple constraint violations', () => {
        const exception = new UniqueConstraintError({
            errors: [
                { path: 'email' } as ValidationErrorItem,
                { path: 'phone' } as ValidationErrorItem,
            ],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.arrayContaining([
                    'Значение поля "email" уже используется',
                    'Значение поля "phone" уже используется',
                ]),
            }),
        );
    });

    it('должен возвращать fallback сообщение если нет errors', () => {
        const exception = new UniqueConstraintError({
            errors: [],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Нарушение уникальности',
            }),
        );
    });

    it('должен обрабатывать error без path', () => {
        const exception = new UniqueConstraintError({
            errors: [
                {
                    path: undefined,
                    value: 'test',
                } as ValidationErrorItem,
            ],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.arrayContaining([
                    'Значение поля "поле" уже используется',
                ]),
            }),
        );
    });

    it('должен включать url и path в response', () => {
        const exception = new UniqueConstraintError({
            errors: [{ path: 'email' } as ValidationErrorItem],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/online-store/user',
                path: '/user',
            }),
        );
    });

    it('должен включать name exception', () => {
        const exception = new UniqueConstraintError({
            errors: [],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'SequelizeUniqueConstraintError',
            }),
        );
    });

    it('должен включать timestamp в ISO формате', () => {
        const exception = new UniqueConstraintError({
            errors: [],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        const callArg = mockResponse.json.mock.calls[0][0];
        expect(callArg.timestamp).toBeDefined();
        expect(new Date(callArg.timestamp)).toBeInstanceOf(Date);
        expect(callArg.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
    });

    it('должен возвращать statusCode: 409', () => {
        const exception = new UniqueConstraintError({
            errors: [{ path: 'username' } as ValidationErrorItem],
        } as unknown as UniqueConstraintError);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: HttpStatus.CONFLICT,
            }),
        );
    });

    it('должен обрабатывать разные field names', () => {
        const fieldNames = ['email', 'phone', 'username', 'sku', 'slug'];

        fieldNames.forEach((field) => {
            const exception = new UniqueConstraintError({
                errors: [{ path: field } as ValidationErrorItem],
            } as unknown as UniqueConstraintError);

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.arrayContaining([
                        `Значение поля "${field}" уже используется`,
                    ]),
                }),
            );
        });
    });
});
