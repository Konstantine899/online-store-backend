import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { AdminGetOrderUserResponse } from '../responses/admin-get-order-user.response';

export function AdminGetOrderUsersSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение заказа пользователя администратором',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'orderId',
            type: String,
            description: 'идентификатор заказа',
            required: true,
        }),
        ApiResponse({
            description: 'Admin get order user',
            status: HttpStatus.OK,
            type: AdminGetOrderUserResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Заказ не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/order/admin/get-order/233',
                    path: '/online-store/order/admin/get-order/233',
                    name: 'NotFoundException',
                    message: 'Заказ не найден',
                },
            },
        }),
    );
}
