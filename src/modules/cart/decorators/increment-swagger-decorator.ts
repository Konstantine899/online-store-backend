import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { IncrementResponse } from '../responses/increment.response';

export function IncrementSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({ summary: 'Увеличение количества товара в корзине' }),
        ApiCookieAuth(),
        ApiParam({
            name: 'productId',
            type: String,
            description: 'Идентификатор продукта',
            required: true,
        }),
        ApiParam({
            name: 'quantity',
            type: String,
            description: 'Количество продуктов',
            required: true,
        }),
        ApiResponse({
            description: 'increment quantity',
            status: HttpStatus.OK,
            type: IncrementResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                anyOf: [
                    {
                        title: 'Корзина не найдена в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/product/55/increment/1',
                            path: '/online-store/cart/product/55/increment/1',
                            name: 'NotFoundException',
                            message: 'Корзина с id:26 не найдена в БД',
                        },
                    },
                    {
                        title: 'Продукт не найден в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/product/56/increment/1',
                            path: '/online-store/cart/product/56/increment/1',
                            name: 'NotFoundException',
                            message: 'Продукт с id:56 не найден в БД',
                        },
                    },
                ],
            },
        }),
    );
}
