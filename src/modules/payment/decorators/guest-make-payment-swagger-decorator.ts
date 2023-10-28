import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MakePaymentDto } from '../dto/make-payment.dto';
import { GuestMakePaymentResponse } from '../responses/guest-make-payment.response';

export function GuestMakePaymentSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({ summary: 'Оплата заказа гостем' }),
        ApiBody({
            type: MakePaymentDto,
            description: 'Структура входных данных для оплаты заказа',
        }),
        ApiResponse({
            description: 'Payment order',
            status: HttpStatus.CREATED,
            type: GuestMakePaymentResponse,
        }),
    );
}
