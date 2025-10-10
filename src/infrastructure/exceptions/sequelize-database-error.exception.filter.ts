import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from 'sequelize';
@Catch(DatabaseError)
export class SequelizeDatabaseErrorExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(
        SequelizeDatabaseErrorExceptionFilter.name,
    );

    // OPTIMIZATION: Move to class-level constant to avoid recreation on each error
    private static readonly ERROR_MESSAGES: Record<string, string> = {
        SequelizeConnectionError: 'Ошибка подключения к базе данных',
        SequelizeTimeoutError:
            'Превышено время ожидания операции с базой данных',
        SequelizeForeignKeyConstraintError: 'Нарушение внешнего ключа',
        SequelizeUniqueConstraintError: 'Нарушение уникальности данных',
        SequelizeValidationError: 'Ошибка валидации данных',
        SequelizeDatabaseError: 'Ошибка базы данных',
        SequelizeConnectionRefusedError: 'Отказ в подключении к базе данных',
        SequelizeAccessDeniedError: 'Доступ к базе данных запрещен',
    };

    catch(exception: DatabaseError, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const { url, path } = request;
        const { name, message } = exception;

        this.logger.error('Database error occurred', {
            errorName: name,
            errorMessage: message,
            url,
            path,
            correlationId: request.headers['x-request-id'],
        });

        const errorResponse = {
            statusCode: HttpStatus.BAD_REQUEST,
            url,
            path,
            type: message,
            name,
            message: this.getRussianMessage(name, message),
            timestamp: new Date().toISOString(),
        };

        response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
    }

    private getRussianMessage(
        errorName: string,
        originalMessage: string,
    ): string {
        const baseMessage =
            SequelizeDatabaseErrorExceptionFilter.ERROR_MESSAGES[errorName] ||
            'Произошла ошибка при работе с базой данных';

        return `${baseMessage}. Детали: ${originalMessage}`;
    }
}
