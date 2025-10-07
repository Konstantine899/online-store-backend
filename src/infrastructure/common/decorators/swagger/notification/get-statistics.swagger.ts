import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';

export function GetStatisticsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить статистику уведомлений',
            description:
                'Возвращает статистику по уведомлениям. Доступно персоналу, менеджерам и администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiQuery({
            name: 'period',
            required: false,
            description: 'Период статистики',
            example: '7d',
        }),
        ApiQuery({
            name: 'type',
            required: false,
            description: 'Тип уведомлений',
            example: 'email',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Статистика уведомлений получена',
            schema: {
                type: 'object',
                properties: {
                    totalSent: { type: 'number', example: 1000 },
                    totalDelivered: { type: 'number', example: 950 },
                    totalRead: { type: 'number', example: 800 },
                    deliveryRate: { type: 'number', example: 95.0 },
                    readRate: { type: 'number', example: 84.2 },
                    byType: {
                        type: 'object',
                        properties: {
                            email: { type: 'number', example: 800 },
                            push: { type: 'number', example: 200 },
                        },
                    },
                    byStatus: {
                        type: 'object',
                        properties: {
                            sent: { type: 'number', example: 1000 },
                            delivered: { type: 'number', example: 950 },
                            read: { type: 'number', example: 800 },
                            failed: { type: 'number', example: 50 },
                        },
                    },
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

