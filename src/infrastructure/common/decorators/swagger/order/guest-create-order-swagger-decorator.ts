import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { orderValidation } from './order.validation';
import { GuestCreateOrderResponse } from '@app/infrastructure/responses';

export function GuestCreateOrderSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Создание заказа гостем' }),
        ApiResponse({
            description: 'User create order',
            status: HttpStatus.CREATED,
            type: GuestCreateOrderResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            schema: {
                anyOf: [
                    {
                        title: 'Ваша корзина пуста',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/order/guest/create-order?id=574&cartId=31',
                            path: '/online-store/order/guest/create-order',
                            name: 'NotFoundException',
                            message: 'Ваша корзина пуста',
                        },
                    },
                    {
                        title: 'Корзина не найдена',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/order/guest/create-order?id=574&cartId=31',
                            path: '/online-store/order/guest/create-order',
                            name: 'NotFoundException',
                            message: 'Корзины с id:26 не найдена БД',
                        },
                    },
                ],
            },
        }),
        ApiBadRequestResponse(orderValidation()),
    );
}
