import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { DatabaseError } from 'sequelize';
import { Request, Response } from 'express';
@Catch(DatabaseError)
export class SequelizeDatabaseErrorExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(
        SequelizeDatabaseErrorExceptionFilter.name,
    );

    catch(exception: DatabaseError, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();
        const request = context.getRequest<Request>();
        const { url, path } = context.getRequest<Request>();
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
            url: url,
            path: path,
            type: message,
            name: name,
            message: this.getRussianMessage(name, message),
            timestamp: new Date().toISOString(),
        };

        response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
    }
    private getRussianMessage(
        errorName: string,
        originalMessage: string,
    ): string {
        const errorMessages: Record<string, string> = {
            SequelizeConnectionError: 'Ошибка подключения к базе данных',
            SequelizeTimeoutError:
                'Превышено время ожидания операции с базой данных',
            SequelizeForeignKeyConstraintError: 'Нарушение внешнего ключа',
            SequelizeUniqueConstraintError: 'Нарушение уникальности данных',
            SequelizeValidationError: 'Ошибка валидации данных',
            SequelizeDatabaseError: 'Ошибка базы данных',
            SequelizeConnectionRefusedError:
                'Отказ в подключении к базе данных',
            SequelizeAccessDeniedError: 'Доступ к базе данных запрещен',
        };

        const baseMessage =
            errorMessages[errorName] ||
            'Произошла ошибка при работе с базой данных';

        return `${baseMessage}. Детали: ${originalMessage}`;
    }
}
