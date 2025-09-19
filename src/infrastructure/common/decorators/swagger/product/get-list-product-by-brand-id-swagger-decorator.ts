import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { GetListProductByBrandIdResponse } from '@app/infrastructure/responses';

export function GetListProductByBrandIdSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary:
                'Получение отсортированного списка продуктов по бренду товара',
        }),
        ApiParam({
            name: 'brandId',
            type: String,
            description: 'идентификатор бренда',
            required: true,
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
            description: 'Get list products by brand',
            status: HttpStatus.OK,
            type: GetListProductByBrandIdResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Список найденных продуктов пуст',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/product/all/brandId/2',
                    path: '/online-store/product/all/brandId/2',
                    name: 'NotFoundException',
                    message: 'По вашему запросу ничего не найдено',
                },
            },
        }),
    );
}
