import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { UserGetOrderListResponse } from '../response/user-get-order-list.response';

export function UserGetOrderListSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({ summary: 'Получение списка заказов пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            description: 'User get list orders',
            status: HttpStatus.OK,
            type: [UserGetOrderListResponse],
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Заказы не найдены',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/order/user/get-all-order',
                    path: '/online-store/order/user/get-all-order',
                    name: 'NotFoundException',
                    message: 'Заказы не найдены',
                },
            },
        }),
    );
}
