import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Статистика пользователей
export function GetUserStatsSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить статистику пользователей',
            description:
                'Возвращает статистику по пользователям системы: общее количество, активные, заблокированные и подписчики рассылки.',
        }),
        ApiResponse({
            status: 200,
            description: 'Статистика пользователей',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'object',
                        properties: {
                            totalUsers: {
                                type: 'number',
                                description: 'Общее количество пользователей',
                                example: 1250,
                            },
                            activeUsers: {
                                type: 'number',
                                description:
                                    'Количество активных пользователей',
                                example: 1100,
                            },
                            blockedUsers: {
                                type: 'number',
                                description:
                                    'Количество заблокированных пользователей',
                                example: 15,
                            },
                            newsletterSubscribers: {
                                type: 'number',
                                description: 'Количество подписчиков рассылки',
                                example: 750,
                            },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Не авторизован',
        }),
        ApiResponse({
            status: 403,
            description: 'Недостаточно прав доступа',
        }),
        ApiBearerAuth('JWT-auth'),
    );
}
