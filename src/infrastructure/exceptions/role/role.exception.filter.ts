import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
    InsufficientPermissionsException,
    RoleAlreadyExistsException,
    RoleHierarchyViolationException,
    RoleNotFoundException,
    TenantIsolationViolationException,
} from './index';

/**
 * Exception Filter для обработки специфичных исключений ролей
 * Обеспечивает единый формат ответов и логирование ошибок
 */
@Catch(
    RoleNotFoundException,
    RoleAlreadyExistsException,
    InsufficientPermissionsException,
    RoleHierarchyViolationException,
    TenantIsolationViolationException,
)
export class RoleExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(RoleExceptionFilter.name);

    catch(
        exception:
            | RoleNotFoundException
            | RoleAlreadyExistsException
            | InsufficientPermissionsException
            | RoleHierarchyViolationException
            | TenantIsolationViolationException,
        host: ArgumentsHost,
    ): void {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const { url, path, method } = request;
        const correlationId =
            (request.headers['x-request-id'] as string) || 'unknown';

        // Определяем статус код и сообщение
        const statusCode = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const message =
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
                ? (exceptionResponse.message as string)
                : exception.message || 'Ошибка при работе с ролями';

        // Логирование в зависимости от типа ошибки
        const logLevel = this.getLogLevel(exception);
        const logContext = {
            method,
            url,
            path,
            exceptionName: exception.constructor.name,
            message,
            correlationId,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            timestamp: new Date().toISOString(),
        };

        if (logLevel === 'warn') {
            this.logger.warn('Role operation error', logContext);
        } else {
            this.logger.error('Role operation error', logContext);
        }

        // Формируем ответ в едином формате
        const errorResponse = {
            statusCode,
            url,
            path,
            name: exception.constructor.name,
            message,
            timestamp: new Date().toISOString(),
        };

        response.status(statusCode).json(errorResponse);
    }

    /**
     * Определяет уровень логирования в зависимости от типа исключения
     */
    private getLogLevel(
        exception:
            | RoleNotFoundException
            | RoleAlreadyExistsException
            | InsufficientPermissionsException
            | RoleHierarchyViolationException
            | TenantIsolationViolationException,
    ): 'warn' | 'error' {
        // Бизнес-ошибки (недостаточно прав, не найдено) - warn
        if (
            exception instanceof RoleNotFoundException ||
            exception instanceof InsufficientPermissionsException ||
            exception instanceof RoleHierarchyViolationException ||
            exception instanceof TenantIsolationViolationException
        ) {
            return 'warn';
        }

        // Конфликты и системные ошибки - error
        return 'error';
    }
}

