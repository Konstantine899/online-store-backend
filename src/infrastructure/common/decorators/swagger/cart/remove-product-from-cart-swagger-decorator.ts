import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveProductFromCartResponse } from '@app/infrastructure/responses';

export function RemoveProductFromCartSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление продукта из корзины' }),
        ApiCookieAuth(),
        ApiParam({
            name: 'productId',
            type: String,
            description: 'Идентификатор продукта',
            required: true,
        }),
        ApiResponse({
            description: 'remove product from cart',
            status: HttpStatus.OK,
            type: RemoveProductFromCartResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            schema: {
                anyOf: [
                    {
                        title: 'Корзина не найдена в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/product/55/remove',
                            path: '/online-store/cart/product/55/remove',
                            name: 'NotFoundException',
                            message: 'Корзина с id:26 не найдена в БД',
                        },
                    },
                    {
                        title: 'Продукт не найден в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/product/56/remove',
                            path: '/online-store/cart/product/56/remove',
                            name: 'NotFoundException',
                            message: 'Продукт с id:56 не найден в БД',
                        },
                    },
                ],
            },
        }),
    );
}
