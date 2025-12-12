import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Создание адреса пользователя
export function CreateUserAddressSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Создать адрес пользователя',
            description:
                'Создает новый адрес для текущего пользователя. Если указан is_default=true, все остальные адреса пользователя становятся неосновными.',
        }),
        ApiResponse({
            status: 201,
            description: 'Адрес успешно создан',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            user_id: { type: 'number', example: 123 },
                            title: { type: 'string', example: 'Дом' },
                            street: { type: 'string', example: 'ул. Пушкина' },
                            house: { type: 'string', example: '10' },
                            apartment: { type: 'string', example: '12' },
                            city: { type: 'string', example: 'Москва' },
                            postal_code: { type: 'string', example: '101000' },
                            country: { type: 'string', example: 'Россия' },
                            is_default: { type: 'boolean', example: true },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Ошибка валидации данных',
        }),
        ApiResponse({
            status: 401,
            description: 'Не авторизован',
        }),
        ApiBearerAuth('JWT-auth'),
    );
}

// Получение всех адресов пользователя
export function GetUserAddressesSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить все адреса пользователя',
            description:
                'Возвращает список всех адресов текущего пользователя, отсортированных по приоритету (основной адрес первым).',
        }),
        ApiResponse({
            status: 200,
            description: 'Список адресов пользователя',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number', example: 1 },
                                user_id: { type: 'number', example: 123 },
                                title: { type: 'string', example: 'Дом' },
                                street: {
                                    type: 'string',
                                    example: 'ул. Пушкина',
                                },
                                house: { type: 'string', example: '10' },
                                apartment: { type: 'string', example: '12' },
                                city: { type: 'string', example: 'Москва' },
                                postal_code: {
                                    type: 'string',
                                    example: '101000',
                                },
                                country: { type: 'string', example: 'Россия' },
                                is_default: { type: 'boolean', example: true },
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
        ApiBearerAuth('JWT-auth'),
    );
}

// Получение конкретного адреса
export function GetUserAddressSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить адрес пользователя по ID',
            description:
                'Возвращает конкретный адрес пользователя по его идентификатору.',
        }),
        ApiResponse({
            status: 200,
            description: 'Адрес пользователя',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            user_id: { type: 'number', example: 123 },
                            title: { type: 'string', example: 'Дом' },
                            street: { type: 'string', example: 'ул. Пушкина' },
                            house: { type: 'string', example: '10' },
                            apartment: { type: 'string', example: '12' },
                            city: { type: 'string', example: 'Москва' },
                            postal_code: { type: 'string', example: '101000' },
                            country: { type: 'string', example: 'Россия' },
                            is_default: { type: 'boolean', example: true },
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
            status: 404,
            description: 'Адрес не найден',
        }),
        ApiBearerAuth('JWT-auth'),
    );
}

// Обновление адреса
export function UpdateUserAddressSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить адрес пользователя',
            description:
                'Обновляет существующий адрес пользователя. Если указан is_default=true, все остальные адреса пользователя становятся неосновными.',
        }),
        ApiResponse({
            status: 200,
            description: 'Адрес успешно обновлен',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            user_id: { type: 'number', example: 123 },
                            title: { type: 'string', example: 'Дом' },
                            street: { type: 'string', example: 'ул. Пушкина' },
                            house: { type: 'string', example: '10' },
                            apartment: { type: 'string', example: '12' },
                            city: { type: 'string', example: 'Москва' },
                            postal_code: { type: 'string', example: '101000' },
                            country: { type: 'string', example: 'Россия' },
                            is_default: { type: 'boolean', example: true },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Ошибка валидации данных',
        }),
        ApiResponse({
            status: 401,
            description: 'Не авторизован',
        }),
        ApiResponse({
            status: 404,
            description: 'Адрес не найден',
        }),
        ApiBearerAuth('JWT-auth'),
    );
}

// Удаление адреса
export function DeleteUserAddressSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Удалить адрес пользователя',
            description: 'Удаляет адрес пользователя по его идентификатору.',
        }),
        ApiResponse({
            status: 200,
            description: 'Адрес успешно удален',
            schema: {
                type: 'object',
                properties: {
                    status: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'success' },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Не авторизован',
        }),
        ApiResponse({
            status: 404,
            description: 'Адрес не найден',
        }),
        ApiBearerAuth('JWT-auth'),
    );
}

// Установка основного адреса
export function SetDefaultAddressSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Установить основной адрес',
            description:
                'Устанавливает указанный адрес как основной для пользователя. Все остальные адреса автоматически становятся неосновными.',
        }),
        ApiResponse({
            status: 200,
            description: 'Основной адрес успешно установлен',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            user_id: { type: 'number', example: 123 },
                            title: { type: 'string', example: 'Дом' },
                            street: { type: 'string', example: 'ул. Пушкина' },
                            house: { type: 'string', example: '10' },
                            apartment: { type: 'string', example: '12' },
                            city: { type: 'string', example: 'Москва' },
                            postal_code: { type: 'string', example: '101000' },
                            country: { type: 'string', example: 'Россия' },
                            is_default: { type: 'boolean', example: true },
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
            status: 404,
            description: 'Адрес не найден',
        }),
        ApiBearerAuth('JWT-auth'),
    );
}
