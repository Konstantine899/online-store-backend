import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { AdminGetStoreOrderListResponse } from '@app/infrastructure/responses';

export function AdminGetStoreOrderListSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение списка всех заказов магазина администратором',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            description: 'Admin get list of all store orders',
            status: HttpStatus.OK,
            type: [AdminGetStoreOrderListResponse],
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Список заказов магазина пуст',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/order/admin/get-all-order',
                    path: '/online-store/order/admin/get-all-order',
                    name: 'NotFoundException',
                    message: 'Список заказов магазина пуст',
                },
            },
        }),
    );
}
