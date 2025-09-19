import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CartResponse } from '@app/infrastructure/responses';

export function GetCartSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Получение корзины' }),
        ApiCookieAuth(),
        ApiResponse({
            description: 'Get cart',
            status: HttpStatus.OK,
            type: CartResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            schema: {
                title: 'Корзина не найдена в БД',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/cart/get-cart',
                    path: '/online-store/cart/get-cart',
                    name: 'NotFoundException',
                    message: 'Корзина с id:26 не найдена в БД',
                },
            },
        }),
    );
}
