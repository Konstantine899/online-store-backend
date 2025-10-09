import { ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

/**
 * Общие переиспользуемые Swagger ответы для оптимизации производительности.
 * Вынесены в отдельный файл для избежания создания одинаковых объектов.
 *
 * Оптимизация: используется мемоизация для кэширования результатов,
 * что уменьшает количество создаваемых объектов при инициализации декораторов.
 */

// Кэш для мемоизации результатов
let unauthorizedResponseCache: ReturnType<typeof ApiResponse> | null = null;
let forbiddenResponseCache: ReturnType<typeof ApiResponse> | null = null;
const notFoundResponseCache = new Map<string, ReturnType<typeof ApiResponse>>();
const badRequestResponseCache = new Map<
    string | undefined,
    ReturnType<typeof ApiResponse>
>();

/**
 * Ответ 401 Unauthorized (мемоизирован)
 */
export const UnauthorizedResponse = () => {
    if (!unauthorizedResponseCache) {
        unauthorizedResponseCache = ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Не авторизован',
        });
    }
    return unauthorizedResponseCache;
};

/**
 * Ответ 403 Forbidden (мемоизирован)
 */
export const ForbiddenResponse = () => {
    if (!forbiddenResponseCache) {
        forbiddenResponseCache = ApiResponse({
            status: HttpStatus.FORBIDDEN,
            description: 'Недостаточно прав доступа',
        });
    }
    return forbiddenResponseCache;
};

/**
 * Ответ 404 Not Found (мемоизирован по resourceName)
 */
export const NotFoundResponse = (resourceName: string) => {
    if (!notFoundResponseCache.has(resourceName)) {
        notFoundResponseCache.set(
            resourceName,
            ApiResponse({
                status: HttpStatus.NOT_FOUND,
                description: `${resourceName} не найден${resourceName === 'Уведомление' ? 'о' : ''}`,
            }),
        );
    }
    return notFoundResponseCache.get(resourceName)!;
};

/**
 * Ответ 400 Bad Request (мемоизирован по message)
 */
export const BadRequestResponse = (message?: string) => {
    if (!badRequestResponseCache.has(message)) {
        badRequestResponseCache.set(
            message,
            ApiResponse({
                status: HttpStatus.BAD_REQUEST,
                description: message || 'Некорректные параметры запроса',
            }),
        );
    }
    return badRequestResponseCache.get(message)!;
};

/**
 * Общая схема для простого ответа с сообщением
 * Используется для успешных операций, возвращающих текстовое сообщение
 */
export const MESSAGE_RESPONSE_SCHEMA = {
    type: 'object' as const,
    properties: {
        message: {
            type: 'string',
            example: 'Операция выполнена успешно',
        },
    },
};

/**
 * Фабрика для создания схемы BadRequest ответа с примером
 * Оптимизирует создание стандартной структуры ошибки валидации
 */
export const createBadRequestSchema = (message: string) => ({
    example: {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
    },
});
