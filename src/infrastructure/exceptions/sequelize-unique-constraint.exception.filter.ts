import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UniqueConstraintError)
export class SequelizeUniqueConstraintExceptionFilter
    implements ExceptionFilter
{
    catch(exception: UniqueConstraintError, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();
        const request = context.getRequest<Request>();
        const { url, path } = request;

        // Формируем человеко-читаемые русские сообщения по затронутым полям
        const messages: string[] = (exception.errors || []).map((e: ValidationErrorItem) => {
            const field = e.path ?? 'поле';
            return `Значение поля "${field}" уже используется`;
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
