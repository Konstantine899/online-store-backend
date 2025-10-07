import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';

export function CreateTemplateSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Создать шаблон уведомления',
            description:
                'Создает новый шаблон уведомления. Доступно только менеджерам и администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.CREATED,
            description: 'Шаблон уведомления создан',
            schema: {
                type: 'object',
                properties: {
                    id: { type: 'number', example: 1 },
                    name: { type: 'string', example: 'order_confirmation' },
                    type: { type: 'string', example: 'email' },
                    title: { type: 'string', example: 'Заказ подтвержден' },
                    message: {
                        type: 'string',
                        example: 'Ваш заказ #{{orderNumber}} подтвержден',
                    },
                    isActive: { type: 'boolean', example: true },
                },
            },
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Некорректные данные шаблона',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Все поля шаблона обязательны',
                },
            },
        }),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Не авторизован',
        }),
        ApiResponse({
            status: HttpStatus.FORBIDDEN,
            description: 'Недостаточно прав доступа',
        }),
    );
}

