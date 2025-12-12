import { GetPaginatedUsersResponse } from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/**
 * Swagger декоратор для поиска неактивных пользователей
 * GET /user/inactive?days=30&page=1&limit=10
 */
export const GetInactiveUsersSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Поиск неактивных пользователей (только для администраторов и staff)',
            description:
                'Находит пользователей, которые не логинились последние N дней. ' +
                'Пользователи, которые никогда не логинились (last_login_at = NULL), также включаются в результат. ' +
                'Результаты отсортированы по дате последнего входа (NULL первыми, затем старые даты).',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiQuery({
            name: 'days',
            type: Number,
            required: true,
            description: 'Количество дней без активности (минимум 1)',
            example: 30,
        }),
        ApiQuery({
            name: 'page',
            type: Number,
            required: false,
            description: 'Номер страницы (по умолчанию 1)',
            example: 1,
        }),
        ApiQuery({
            name: 'limit',
            type: Number,
            required: false,
            description: 'Размер страницы (по умолчанию 5, максимум 100)',
            example: 10,
        }),
        ApiOkResponse({
            description: 'Список неактивных пользователей успешно получен',
            type: GetPaginatedUsersResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные параметры запроса (days <= 0, page < 1, limit вне диапазона 1-100)',
            schema: {
                examples: {
                    invalidDays: {
                        summary: 'Некорректное количество дней',
                        value: {
                            statusCode: 400,
                            message: 'Количество дней должно быть больше 0',
                            error: 'Bad Request',
                        },
                    },
                    invalidLimit: {
                        summary: 'Некорректный размер страницы',
                        value: {
                            statusCode: 400,
                            message: 'Размер страницы должен быть от 1 до 100',
                            error: 'Bad Request',
                        },
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
        ApiForbiddenResponse({
            description:
                'Недостаточно прав (требуется роль администратора или staff)',
            schema: {
                example: {
                    statusCode: 403,
                    message: 'У вас недостаточно прав доступа',
                },
            },
        }),
    );

/**
 * Swagger декоратор для поиска пользователей с неполным профилем
 * GET /user/incomplete-profiles?page=1&limit=10
 */
export const GetIncompleteProfilesSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Поиск пользователей с неполным профилем (только для администраторов и staff)',
            description:
                'Находит пользователей с флагом is_profile_completed = false. ' +
                'Такие пользователи могут не заполнить обязательные поля профиля (имя, фамилия, телефон и т.д.). ' +
                'Результаты отсортированы по дате создания (новые первыми).',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiQuery({
            name: 'page',
            type: Number,
            required: false,
            description: 'Номер страницы (по умолчанию 1)',
            example: 1,
        }),
        ApiQuery({
            name: 'limit',
            type: Number,
            required: false,
            description: 'Размер страницы (по умолчанию 5, максимум 100)',
            example: 10,
        }),
        ApiOkResponse({
            description:
                'Список пользователей с неполным профилем успешно получен',
            type: GetPaginatedUsersResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные параметры запроса (page < 1, limit вне диапазона 1-100)',
            schema: {
                example: {
                    statusCode: 400,
                    message: 'Размер страницы должен быть от 1 до 100',
                    error: 'Bad Request',
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
        ApiForbiddenResponse({
            description:
                'Недостаточно прав (требуется роль администратора или staff)',
            schema: {
                example: {
                    statusCode: 403,
                    message: 'У вас недостаточно прав доступа',
                },
            },
        }),
    );

/**
 * Swagger декоратор для поиска пользователей по диапазону дат
 * GET /user/date-range?field=createdAt&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
 */
export const GetUsersByDateRangeSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Поиск пользователей по диапазону дат (только для администраторов и staff)',
            description:
                'Находит пользователей, у которых указанное поле (createdAt или lastLoginAt) ' +
                'попадает в заданный диапазон дат. ' +
                'Полезно для поиска пользователей, зарегистрированных или активных в определённый период. ' +
                'Результаты отсортированы по указанному полю (новые первыми).',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiQuery({
            name: 'field',
            enum: ['createdAt', 'lastLoginAt'],
            required: true,
            description:
                'Поле для фильтрации: "createdAt" (дата регистрации) или "lastLoginAt" (дата последнего входа)',
            example: 'createdAt',
        }),
        ApiQuery({
            name: 'startDate',
            type: String,
            required: true,
            description: 'Начальная дата в формате ISO 8601',
            example: '2024-01-01T00:00:00.000Z',
        }),
        ApiQuery({
            name: 'endDate',
            type: String,
            required: true,
            description: 'Конечная дата в формате ISO 8601',
            example: '2024-12-31T23:59:59.999Z',
        }),
        ApiQuery({
            name: 'page',
            type: Number,
            required: false,
            description: 'Номер страницы (по умолчанию 1)',
            example: 1,
        }),
        ApiQuery({
            name: 'limit',
            type: Number,
            required: false,
            description: 'Размер страницы (по умолчанию 5, максимум 100)',
            example: 10,
        }),
        ApiOkResponse({
            description:
                'Список пользователей по диапазону дат успешно получен',
            type: GetPaginatedUsersResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные параметры запроса (неверное поле, startDate >= endDate, page < 1, limit вне диапазона 1-100)',
            schema: {
                examples: {
                    invalidField: {
                        summary: 'Некорректное поле',
                        value: {
                            statusCode: 400,
                            message:
                                'Поле должно быть "createdAt" или "lastLoginAt"',
                            error: 'Bad Request',
                        },
                    },
                    invalidDateRange: {
                        summary: 'Некорректный диапазон дат',
                        value: {
                            statusCode: 400,
                            message:
                                'Начальная дата должна быть меньше конечной',
                            error: 'Bad Request',
                        },
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
        ApiForbiddenResponse({
            description:
                'Недостаточно прав (требуется роль администратора или staff)',
            schema: {
                example: {
                    statusCode: 403,
                    message: 'У вас недостаточно прав доступа',
                },
            },
        }),
    );
