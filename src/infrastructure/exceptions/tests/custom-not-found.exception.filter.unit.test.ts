import type { ArgumentsHost} from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { CustomNotFoundExceptionFilter } from '../custom-not-found.exception.filter';

/**
 * TEST-031: CustomNotFoundExceptionFilter Unit Tests
 *
 * Coverage goal: ≥75% для exception filters
 */

describe('CustomNotFoundExceptionFilter', () => {
    let filter: CustomNotFoundExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;
    let mockRequest: { url: string; path: string };
    let mockResponse: { status: jest.Mock; json: jest.Mock };

    beforeEach(() => {
        filter = new CustomNotFoundExceptionFilter();

        mockRequest = {
            url: '/online-store/user/99999',
            path: '/user/99999',
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

    it('должен вернуть 404 с полной информацией', () => {
        const exception = new NotFoundException('Пользователь не найден');

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: 404,
            url: '/online-store/user/99999',
            path: '/user/99999',
            name: 'NotFoundException',
            message: 'Пользователь не найден',
        });
    });

    it('должен обрабатывать object как сообщение (извлекает message поле)', () => {
        const exception = new NotFoundException({
            status: 404,
            message: 'Custom error message',
        });

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: 404,
                message: 'Custom error message', // NestJS извлекает message из object
            }),
        );
    });

    it('должен включать url и path из request', () => {
        const exception = new NotFoundException('Not found');

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/online-store/user/99999',
                path: '/user/99999',
            }),
        );
    });

    it('должен сохранять name исключения', () => {
        const exception = new NotFoundException('Test');

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'NotFoundException',
            }),
        );
    });

    it('должен работать с разными URL paths', () => {
        mockRequest.url = '/online-store/product/missing';
        mockRequest.path = '/product/missing';

        const exception = new NotFoundException('Продукт не найден');

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/online-store/product/missing',
                path: '/product/missing',
            }),
        );
    });
});
