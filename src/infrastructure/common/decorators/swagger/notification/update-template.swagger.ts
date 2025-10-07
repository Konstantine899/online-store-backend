import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export function UpdateTemplateSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить шаблон уведомления',
            description:
                'Обновляет существующий шаблон уведомления. Доступно только менеджерам и администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            description: 'ID шаблона',
            example: 1,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Шаблон уведомления обновлен',
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
            description: 'Некорректные данные для обновления',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Нет данных для обновления',
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
        ApiResponse({
            status: HttpStatus.NOT_FOUND,
            description: 'Шаблон не найден',
        }),
    );
}

