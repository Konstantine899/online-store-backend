import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
    UnauthorizedResponse,
    ForbiddenResponse,
    createBadRequestSchema,
} from './common-responses';

// Схема шаблона для переиспользования
const TEMPLATE_SCHEMA = {
    type: 'object' as const,
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
};

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
            schema: TEMPLATE_SCHEMA,
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Некорректные данные шаблона',
            schema: createBadRequestSchema('Все поля шаблона обязательны'),
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
    );
}

// Экспортируем схему для использования в update-template
export { TEMPLATE_SCHEMA };
