import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiOperation,
    ApiResponse,
    OmitType,
} from '@nestjs/swagger';
import { OrderDto } from '@app/infrastructure/dto';
import { orderValidation } from './order.validation';
import { UserCreateOrderResponse } from '@app/infrastructure/responses';

export function UserCreateOrderSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Создание заказа пользователем' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: OmitType(OrderDto, ['userId']),
            description: 'Входящая структура данных для создания заказа',
        }),
        ApiResponse({
            description: 'User create order',
            status: HttpStatus.CREATED,
            type: UserCreateOrderResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                anyOf: [
                    {
                        title: 'Ваша корзина пуста',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/order/user/create-order?id=574&cartId=31',
                            path: '/online-store/order/guest/create-order',
                            name: 'NotFoundException',
                            message: 'Ваша корзина пуста',
                        },
                    },
                    {
                        title: 'Корзина не найдена',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/order/user/create-order?id=574&cartId=31',
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
