import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { GetListProductResponse } from '@app/infrastructure/responses';

export function GetListProductSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Получение списка всех продуктов' }),
        ApiQuery({ name: 'search', type: 'string', required: false }),
        ApiQuery({ name: 'sort', type: 'string', required: false }),
        ApiQuery({
            name: 'page',
            type: 'number',
            required: true,
            description: 'Номер страницы',
        }),
        ApiQuery({
            name: 'size',
            type: 'number',
            required: true,
            description: 'Количество элементов на странице',
        }),
        ApiResponse({
            description: 'Get list products',
            status: HttpStatus.OK,
            type: GetListProductResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Список найденных продуктов пуст',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/product/all?search=Xiaomi%20Redmi%20Note%2010ww',
                    path: '/online-store/product/all',
                    name: 'NotFoundException',
                    message: 'По вашему запросу ничего не найдено',
                },
            },
        }),
    );
}
