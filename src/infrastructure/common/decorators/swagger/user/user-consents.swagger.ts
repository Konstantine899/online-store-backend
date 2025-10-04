import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

export function UpdateUserConsentsSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить согласия пользователя',
            description: 'Обновляет согласия пользователя на рассылку, маркетинг, cookies, условия использования и политику конфиденциальности',
        }),
        ApiBody({
            description: 'Данные для обновления согласий',
            schema: {
                type: 'object',
                properties: {
                    is_newsletter_subscribed: {
                        type: 'boolean',
                        description: 'Согласие на рассылку новостей',
                        example: true,
                    },
                    is_marketing_consent: {
                        type: 'boolean',
                        description: 'Согласие на маркетинговые сообщения',
                        example: false,
                    },
                    is_cookie_consent: {
                        type: 'boolean',
                        description: 'Согласие на использование cookies',
                        example: true,
                    },
                    is_terms_accepted: {
                        type: 'boolean',
                        description: 'Принятие пользовательского соглашения',
                        example: true,
                    },
                    is_privacy_accepted: {
                        type: 'boolean',
                        description: 'Принятие политики конфиденциальности',
                        example: true,
                    },
                },
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Согласия успешно обновлены',
            schema: {
                type: 'object',
                properties: {
                    status: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'success' },
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            email: { type: 'string', example: 'user@example.com' },
                            is_newsletter_subscribed: { type: 'boolean', example: true },
                            is_marketing_consent: { type: 'boolean', example: false },
                            is_cookie_consent: { type: 'boolean', example: true },
                            is_terms_accepted: { type: 'boolean', example: true },
                            is_privacy_accepted: { type: 'boolean', example: true },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Ошибка валидации данных',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 400 },
                    message: { type: 'array', items: { type: 'string' } },
                    error: { type: 'string', example: 'Bad Request' },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Не авторизован',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' },
                },
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Пользователь не найден',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 404 },
                    message: { type: 'string', example: 'Пользователь не найден' },
                },
            },
        }),
        ApiBearerAuth('JWT-auth'),
    );
}

export function BulkUpdateConsentsSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({
            summary: 'Массовое обновление согласий пользователей',
            description: 'Обновляет согласия для нескольких пользователей одновременно. Доступно только для менеджеров и администраторов.',
        }),
        ApiBody({
            description: 'Список обновлений согласий для пользователей',
            schema: {
                type: 'object',
                properties: {
                    updates: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                userId: {
                                    type: 'number',
                                    description: 'ID пользователя',
                                    example: 123,
                                },
                                is_newsletter_subscribed: {
                                    type: 'boolean',
                                    description: 'Согласие на рассылку новостей',
                                    example: true,
                                },
                                is_marketing_consent: {
                                    type: 'boolean',
                                    description: 'Согласие на маркетинговые сообщения',
                                    example: false,
                                },
                                is_cookie_consent: {
                                    type: 'boolean',
                                    description: 'Согласие на использование cookies',
                                    example: true,
                                },
                                is_terms_accepted: {
                                    type: 'boolean',
                                    description: 'Принятие пользовательского соглашения',
                                    example: true,
                                },
                                is_privacy_accepted: {
                                    type: 'boolean',
                                    description: 'Принятие политики конфиденциальности',
                                    example: true,
                                },
                            },
                        },
                        example: [
                            {
                                userId: 123,
                                is_newsletter_subscribed: true,
                                is_marketing_consent: false,
                            },
                            {
                                userId: 456,
                                is_cookie_consent: true,
                                is_terms_accepted: true,
                            },
                        ],
                    },
                },
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Массовое обновление завершено',
            schema: {
                type: 'object',
                properties: {
                    status: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'success' },
                    data: {
                        type: 'object',
                        properties: {
                            success: { type: 'number', example: 2 },
                            failed: { type: 'number', example: 0 },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Ошибка валидации данных',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 400 },
                    message: { type: 'array', items: { type: 'string' } },
                    error: { type: 'string', example: 'Bad Request' },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Не авторизован',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' },
                },
            },
        }),
        ApiResponse({
            status: 403,
            description: 'Недостаточно прав доступа',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 403 },
                    message: { type: 'string', example: 'Forbidden' },
                },
            },
        }),
        ApiBearerAuth('JWT-auth'),
    );
}

export function GetConsentStatsSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить статистику согласий пользователей',
            description: 'Возвращает статистику по согласиям пользователей. Доступно только для менеджеров и администраторов.',
        }),
        ApiResponse({
            status: 200,
            description: 'Статистика согласий получена',
            schema: {
                type: 'object',
                properties: {
                    status: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'success' },
                    data: {
                        type: 'object',
                        properties: {
                            newsletterSubscribers: {
                                type: 'number',
                                description: 'Количество подписчиков на рассылку',
                                example: 150,
                            },
                            marketingConsent: {
                                type: 'number',
                                description: 'Количество пользователей с согласием на маркетинг',
                                example: 120,
                            },
                            cookieConsent: {
                                type: 'number',
                                description: 'Количество пользователей с согласием на cookies',
                                example: 200,
                            },
                            termsAccepted: {
                                type: 'number',
                                description: 'Количество пользователей, принявших условия',
                                example: 180,
                            },
                            privacyAccepted: {
                                type: 'number',
                                description: 'Количество пользователей, принявших политику конфиденциальности',
                                example: 175,
                            },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Не авторизован',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' },
                },
            },
        }),
        ApiResponse({
            status: 403,
            description: 'Недостаточно прав доступа',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 403 },
                    message: { type: 'string', example: 'Forbidden' },
                },
            },
        }),
        ApiBearerAuth('JWT-auth'),
    );
}
