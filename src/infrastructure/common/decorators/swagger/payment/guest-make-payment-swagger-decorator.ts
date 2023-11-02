import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MakePaymentDto } from '../../../../dto/payment/make.payment.dto';
import { GuestMakePaymentResponse } from '../../../../responses/payment/guest-make-payment.response';

export function GuestMakePaymentSwaggerDecorator(): Function {
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