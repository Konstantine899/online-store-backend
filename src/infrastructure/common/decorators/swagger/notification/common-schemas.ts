import { ApiParam, ApiQuery } from '@nestjs/swagger';

/**
 * Общие переиспользуемые Swagger схемы для оптимизации производительности.
 * Константы создаются один раз при загрузке модуля.
 */

/**
 * Стандартные query параметры для пагинации
 * Используется в endpoints с листингом данных
 */
export const PAGINATION_QUERIES = [
    ApiQuery({
        name: 'page',
        required: false,
        description: 'Номер страницы',
        example: 1,
    }),
    ApiQuery({
        name: 'limit',
        required: false,
        description: 'Количество элементов на странице',
        example: 20,
    }),
];

/**
 * Фабрика для создания схемы метаданных пагинации
 * Позволяет кастомизировать примеры для разных контекстов
 */
export const createMetaSchema = (
    totalExample = 100,
    lastPageExample = 5,
): {
    type: 'object';
    properties: {
        totalCount: { type: string; example: number };
        currentPage: { type: string; example: number };
        lastPage: { type: string; example: number };
        limit: { type: string; example: number };
    };
} => ({
    type: 'object' as const,
    properties: {
        totalCount: { type: 'number', example: totalExample },
        currentPage: { type: 'number', example: 1 },
        lastPage: { type: 'number', example: lastPageExample },
        limit: { type: 'number', example: 20 },
    },
});

/**
 * Стандартная схема метаданных для большинства случаев
 */
export const META_SCHEMA = createMetaSchema(100, 5);

/**
 * Фабрика для создания пагинированного ответа
 * Оптимизирует создание структуры { data: [], meta: {} }
 */
export const createPaginatedResponseSchema = (
    itemSchema: Record<string, unknown>,
    metaSchema = META_SCHEMA,
): {
    type: 'object';
    properties: {
        data: { type: string; items: Record<string, unknown> };
        meta: typeof META_SCHEMA;
    };
} => ({
    type: 'object' as const,
    properties: {
        data: {
            type: 'array',
            items: itemSchema,
        },
        meta: metaSchema,
    },
});

/**
 * Фабрика для создания стандартного ApiParam для 'id'
 * Переиспользуется в update/delete endpoints
 */
export const createIdParam = (
    resourceName: string,
): MethodDecorator & ClassDecorator =>
    ApiParam({
        name: 'id',
        description: `ID ${resourceName}`,
        example: 1,
    });
