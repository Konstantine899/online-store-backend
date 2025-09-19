import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { AdminRemoveOrderResponse } from '@app/infrastructure/responses';

export function AdminRemoveOrderSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление заказа администратором' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'orderId',
            type: 'string',
            description: 'идентификатор заказа',
            required: true,
        }),
        ApiResponse({
            description: 'Remove order',
            status: HttpStatus.OK,
            type: AdminRemoveOrderResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Заказ не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/order/admin/delete-order/53',
                    path: '/online-store/order/admin/delete-order/53',
                    name: 'NotFoundException',
                    message: 'Заказ не найден',
                },
            },
        }),
    );
}
