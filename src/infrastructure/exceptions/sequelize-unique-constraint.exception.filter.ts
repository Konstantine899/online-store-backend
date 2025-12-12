import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';

@Catch(UniqueConstraintError)
export class SequelizeUniqueConstraintExceptionFilter
    implements ExceptionFilter
{
    private readonly logger = new Logger(
        SequelizeUniqueConstraintExceptionFilter.name,
    );

    catch(exception: UniqueConstraintError, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const { url, path } = request;

        // Формируем человеко-читаемые русские сообщения по затронутым полям
        const messages: string[] = (exception.errors || []).map(
            (e: ValidationErrorItem) => {
                const field = e.path ?? 'поле';
                return `Значение поля "${field}" уже используется`;
            },
        );

        // OPTIMIZATION: Add logging for audit trail consistency
        this.logger.warn('Unique constraint violation', {
            fields: exception.errors?.map((e) => e.path).filter(Boolean),
            url,
            path,
            correlationId: request.headers['x-request-id'],
        });

        const errorResponse = {
            statusCode: HttpStatus.CONFLICT,
            url,
            path,
            name: exception.name,
            message: messages.length ? messages : 'Нарушение уникальности',
            timestamp: new Date().toISOString(),
        };

        response.status(HttpStatus.CONFLICT).json(errorResponse);
    }
}
