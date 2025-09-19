import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { GetAllByBrandIdAndCategoryIdResponse } from '@app/infrastructure/responses';

export function GetAllByBrandIdAndCategoryIdSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary:
                'Получение отсортированного списка продуктов по бренду и по категории товара',
        }),
        ApiParam({
            name: 'brandId',
            type: String,
            description: 'идентификатор бренда',
            required: true,
        }),
        ApiOperation({
            summary:
                'Получение отсортированного списка продуктов по категории и по бренду товара',
        }),
        ApiQuery({ name: 'search', type: 'string', required: false }),
        ApiQuery({ name: 'sort', type: 'string', required: false }),
        ApiQuery({
            name: 'page',
            type: Number,
            required: true,
            description: 'Номер страницы',
        }),
        ApiQuery({
            name: 'size',
            type: Number,
            required: true,
            description: 'Количество элементов на странице',
        }),
        ApiResponse({
            description: 'Get list products by brand and category',
            status: HttpStatus.OK,
            type: GetAllByBrandIdAndCategoryIdResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Список найденных продуктов пуст',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/product/all/brandId/1/categoryId/2?page=1&size=1',
                    path: '/online-store/product/all/brandId/1/categoryId/2',
                    name: 'NotFoundException',
                    message: 'По вашему запросу ничего не найдено',
                },
            },
        }),
    );
}
