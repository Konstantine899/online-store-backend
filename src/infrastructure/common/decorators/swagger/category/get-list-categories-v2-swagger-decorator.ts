import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { GetListCategoriesV2Response } from '@app/infrastructure/responses/category/get-list-categories-v2.response';

export function GetListCategoriesV2SwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение списка категорий с пагинацией (V2)',
            description:
                'Возвращает список категорий с поддержкой пагинации, поиска и сортировки. Изолировано по tenant_id.',
        }),
        ApiQuery({
            name: 'page',
            required: false,
            type: Number,
            description: 'Номер страницы (по умолчанию: 1)',
            example: 1,
        }),
        ApiQuery({
            name: 'size',
            required: false,
            type: Number,
            description: 'Количество элементов на странице (по умолчанию: 5)',
            example: 5,
        }),
        ApiQuery({
            name: 'search',
            required: false,
            type: String,
            description: 'Поиск по названию категории',
            example: 'смартфон',
        }),
        ApiQuery({
            name: 'sort',
            required: false,
            type: String,
            description: 'Направление сортировки (ASC или DESC, по умолчанию: DESC)',
            enum: ['ASC', 'DESC'],
            example: 'DESC',
        }),
        ApiResponse({
            description: 'Список категорий с метаданными пагинации',
            status: HttpStatus.OK,
            type: GetListCategoriesV2Response,
        }),
        ApiNotFoundResponse({
            description: 'Категории не найдены',
            schema: {
                title: 'Список категорий пуст',
                example: {
                    status: HttpStatus.NOT_FOUND,
                    message: 'Категории товаров не найдены',
                },
            },
        }),
    );
}

