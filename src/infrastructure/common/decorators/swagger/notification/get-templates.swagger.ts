import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';

export function GetTemplatesSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить шаблоны уведомлений',
            description:
                'Возвращает список шаблонов уведомлений. Доступно только менеджерам и администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiQuery({
            name: 'page',
            required: false,
            description: 'Номер страницы',
            example: 1,
        }),
        ApiQuery({
            name: 'limit',
            required: false,
            description: 'Количество элементов на странице',
            example: 20,
        }),
        ApiQuery({
            name: 'type',
            required: false,
            description: 'Фильтр по типу шаблона',
            example: 'email',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Шаблоны уведомлений получены',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number', example: 1 },
                                name: {
                                    type: 'string',
                                    example: 'order_confirmation',
                                },
                                type: { type: 'string', example: 'email' },
                                title: {
                                    type: 'string',
                                    example: 'Заказ подтвержден',
                                },
                                isActive: { type: 'boolean', example: true },
                            },
                        },
                    },
                    meta: {
                        type: 'object',
                        properties: {
                            totalCount: { type: 'number', example: 10 },
                            currentPage: { type: 'number', example: 1 },
                            lastPage: { type: 'number', example: 1 },
                            limit: { type: 'number', example: 20 },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Некорректные параметры запроса',
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

