import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Статистика пользователей
export function GetUserStatsSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить статистику пользователей',
            description:
                'Возвращает подробную статистику по пользователям системы: общее количество, активные/заблокированные, VIP, подписчики рассылки, премиум пользователи, сотрудники, партнеры, оптовые покупатели и высокоценные клиенты.',
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
                            vipUsers: {
                                type: 'number',
                                description: 'Количество VIP пользователей',
                                example: 85,
                            },
                            newsletterSubscribers: {
                                type: 'number',
                                description: 'Количество подписчиков рассылки',
                                example: 750,
                            },
                            premiumUsers: {
                                type: 'number',
                                description: 'Количество премиум пользователей',
                                example: 120,
                            },
                            employees: {
                                type: 'number',
                                description: 'Количество сотрудников',
                                example: 25,
                            },
                            affiliates: {
                                type: 'number',
                                description: 'Количество партнеров/аффилиатов',
                                example: 45,
                            },
                            wholesaleUsers: {
                                type: 'number',
                                description: 'Количество оптовых покупателей',
                                example: 30,
                            },
                            highValueUsers: {
                                type: 'number',
                                description: 'Количество высокоценных клиентов',
                                example: 65,
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
