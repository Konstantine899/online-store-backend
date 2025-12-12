import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import {
    UnauthorizedResponse,
    ForbiddenResponse,
    BadRequestResponse,
} from './common-responses';
import {
    PAGINATION_QUERIES,
    createPaginatedResponseSchema,
    createMetaSchema,
} from './common-schemas';

// Схема элемента шаблона для списка
const TEMPLATE_LIST_ITEM_SCHEMA = {
    type: 'object' as const,
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
};

export function GetTemplatesSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить шаблоны уведомлений',
            description:
                'Возвращает список шаблонов уведомлений. Доступно только менеджерам и администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        ...PAGINATION_QUERIES,
        ApiQuery({
            name: 'type',
            required: false,
            description: 'Фильтр по типу шаблона',
            example: 'email',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Шаблоны уведомлений получены',
            schema: createPaginatedResponseSchema(
                TEMPLATE_LIST_ITEM_SCHEMA,
                createMetaSchema(10, 1), // Для шаблонов обычно меньше элементов
            ),
        }),
        BadRequestResponse(),
        UnauthorizedResponse(),
        ForbiddenResponse(),
    );
}
