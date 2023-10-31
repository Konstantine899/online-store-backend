import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { OrderDto } from '../../../../dto/order/order.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { orderValidation } from './order.validation';
import { AdminCreateOrderResponse } from '../../../../responses/order/admin-create-order.response';

export function AdminCreateOrderSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Создание заказа администратором' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: OrderDto,
            description: 'Структура входных данных для создания заказа',
        }),
        ApiResponse({
            description: 'Admin create order',
            status: HttpStatus.CREATED,
            type: AdminCreateOrderResponse,
        }),
        ApiBadRequestResponse(orderValidation()),
    );
}
