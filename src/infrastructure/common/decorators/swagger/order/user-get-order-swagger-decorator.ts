import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { UserGetOrderResponse } from '@app/infrastructure/responses';

export function UserGetOrderSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Получение заказа пользователем' }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            description: 'User get order',
            status: HttpStatus.OK,
            type: UserGetOrderResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Заказ не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/order/user/get-order/711',
                    path: '/online-store/order/user/get-order/711',
                    name: 'NotFoundException',
                    message: 'Заказ не найден',
                },
            },
        }),
    );
}
