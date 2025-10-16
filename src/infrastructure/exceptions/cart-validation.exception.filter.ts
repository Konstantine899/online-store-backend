import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Exception Filter для ошибок валидации корзины
 * Обрабатывает специфичные ошибки CartService с детальным контекстом
 */
@Catch(BadRequestException)
export class CartValidationExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(CartValidationExceptionFilter.name);

    catch(exception: BadRequestException, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const { url, path, method } = request;
        const statusCode = exception.getStatus();
        const { message } = exception;

        // Проверяем, является ли это ошибкой корзины
        const isCartError = this.isCartRelatedError(path, message);

        if (isCartError) {
            this.logger.warn(`Cart validation error occurred`, {
                method,
                url,
                path,
                statusCode,
                message,
                correlationId: request.headers['x-request-id'],
                userAgent: request.headers['user-agent'],
                ip: request.ip,
                timestamp: new Date().toISOString(),
            });
        }

        // Формируем детальный ответ для ошибок корзины
        const errorResponse = {
            statusCode,
            url,
            path,
            name: 'CartValidationError',
            message: Array.isArray(message) ? message : [message],
            timestamp: new Date().toISOString(),
            ...(isCartError && {
                details: {
                    module: 'cart',
                    operation: this.extractOperation(method, path),
                    suggestion: this.getSuggestion(message),
                },
            }),
        };

        response.status(statusCode).json(errorResponse);
    }

    /**
     * Определяет, является ли ошибка связанной с корзиной
     */
    private isCartRelatedError(
        path: string,
        message: string | string[],
    ): boolean {
        const cartPaths = ['/cart', '/basket'];
        const cartMessages = [
            'корзин',
            'товар',
            'количество',
            'промокод',
            'cart',
            'product',
            'quantity',
            'promo',
        ];

        const isCartPath = cartPaths.some((cartPath) =>
            path.includes(cartPath),
        );
        const messageStr = Array.isArray(message) ? message.join(' ') : message;
        const isCartMessage = cartMessages.some((cartMsg) =>
            messageStr.toLowerCase().includes(cartMsg.toLowerCase()),
        );

        return isCartPath || isCartMessage;
    }

    /**
     * Извлекает тип операции из пути и метода
     */
    private extractOperation(method: string, path: string): string {
        if (path.includes('/cart')) {
            if (method === 'POST' && path.includes('/append'))
                return 'add-to-cart';
            if (method === 'PUT' && path.includes('/increment'))
                return 'increment-item';
            if (method === 'PUT' && path.includes('/decrement'))
                return 'decrement-item';
            if (method === 'DELETE' && path.includes('/remove'))
                return 'remove-item';
            if (method === 'DELETE' && path.includes('/clear'))
                return 'clear-cart';
            if (method === 'POST' && path.includes('/promo'))
                return 'apply-promo-code';
            if (method === 'DELETE' && path.includes('/promo'))
                return 'remove-promo-code';
            if (method === 'GET') return 'get-cart';
        }
        return 'unknown';
    }

    /**
     * Предоставляет полезные предложения для пользователя
     */
    private getSuggestion(message: string | string[]): string {
        const messageStr = Array.isArray(message) ? message.join(' ') : message;

        if (messageStr.includes('количество')) {
            return 'Проверьте количество товара. Минимальное количество: 1, максимальное: 999';
        }
        if (messageStr.includes('промокод')) {
            return 'Проверьте правильность введенного промокода и его срок действия';
        }
        if (messageStr.includes('товар')) {
            return 'Убедитесь, что товар доступен для заказа';
        }
        if (messageStr.includes('корзин')) {
            return 'Проверьте статус корзины. Возможно, она истекла или была конвертирована в заказ';
        }

        return 'Проверьте корректность введенных данных';
    }
}
