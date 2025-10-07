import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UnauthorizedResponse, ForbiddenResponse, createBadRequestSchema } from './common-responses';
import { PAGINATION_QUERIES, createPaginatedResponseSchema } from './common-schemas';

// Константы для фильтрации
const FILTER_QUERIES = [
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
];

// Схема элемента уведомления
const NOTIFICATION_ITEM_SCHEMA = {
    type: 'object' as const,
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
};

export function GetUserNotificationsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить уведомления пользователя',
            description:
                'Возвращает список уведомлений с пагинацией. Клиенты видят только свои уведомления, администраторы - все уведомления тенанта.',
        }),
        ApiBearerAuth('JWT-auth'),
        ...PAGINATION_QUERIES,
        ...FILTER_QUERIES,
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Уведомления получены успешно',
            schema: createPaginatedResponseSchema(NOTIFICATION_ITEM_SCHEMA),
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Некорректные параметры запроса',
            schema: createBadRequestSchema(
                'Некорректные параметры пагинации: page и limit должны быть >= 1, limit <= 100',
            ),
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
    );
}
