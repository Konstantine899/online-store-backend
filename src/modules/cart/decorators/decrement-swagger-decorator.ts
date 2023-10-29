import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { DecrementResponse } from '../responses/decrement.response';

export function DecrementSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Уменьшение количества товара в корзине' }),
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
            description: 'decrement quantity',
            status: HttpStatus.OK,
            type: DecrementResponse,
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
                            url: '/online-store/cart/product/55/decrement/1',
                            path: '/online-store/cart/product/55/decrement/1',
                            name: 'NotFoundException',
                            message: 'Корзина с id:26 не найдена в БД',
                        },
                    },
                    {
                        title: 'Продукт не найден в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/product/56/decrement/1',
                            path: '/online-store/cart/product/56/decrement/1',
                            name: 'NotFoundException',
                            message: 'Продукт с id:56 не найден в БД',
                        },
                    },
                ],
            },
        }),
    );
}
