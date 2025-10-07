import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';

export function GetUserNotificationsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить уведомления пользователя',
            description:
                'Возвращает список уведомлений с пагинацией. Клиенты видят только свои уведомления, администраторы - все уведомления тенанта.',
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
            name: 'status',
            required: false,
            description: 'Фильтр по статусу',
            example: 'unread',
        }),
        ApiQuery({
            name: 'type',
            required: false,
            description: 'Фильтр по типу',
            example: 'email',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Уведомления получены успешно',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number', example: 1 },
                                type: { type: 'string', example: 'email' },
                                title: {
                                    type: 'string',
                                    example: 'Заказ подтвержден',
                                },
                                message: {
                                    type: 'string',
                                    example: 'Ваш заказ #12345 подтвержден',
                                },
                                status: { type: 'string', example: 'sent' },
                                createdAt: {
                                    type: 'string',
                                    format: 'date-time',
                                },
                            },
                        },
                    },
                    meta: {
                        type: 'object',
                        properties: {
                            totalCount: { type: 'number', example: 100 },
                            currentPage: { type: 'number', example: 1 },
                            lastPage: { type: 'number', example: 5 },
                            limit: { type: 'number', example: 20 },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Некорректные параметры запроса',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message:
                        'Некорректные параметры пагинации: page и limit должны быть >= 1, limit <= 100',
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

