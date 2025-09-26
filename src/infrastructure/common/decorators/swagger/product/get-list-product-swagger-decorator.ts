import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';

export function GetListProductSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Получение списка всех продуктов' }),
        ApiQuery({ name: 'search', type: 'string', required: false }),
        ApiQuery({ name: 'sort', type: 'string', required: false }),
        ApiQuery({
            name: 'page',
            type: 'number',
            required: false, // по умолчанию передаю 1
            description: 'Номер страницы (по умолчанию 1)',
            example: 1,
        }),
        ApiQuery({
            name: 'size',
            type: 'number',
            required: false, // по умолчанию передаеться 5
            description:
                'Количество элементов на странице (по умолчанию 5, максимум 100)',
            example: 5,
        }),
        ApiResponse({
            status: HttpStatus.TOO_MANY_REQUESTS,
            description: 'Слишком много запросов', // НОВЫЙ КОД
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
