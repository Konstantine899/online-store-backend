import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { MakePaymentDto } from '../dto/make-payment.dto';
import { UserMakePaymentResponse } from '../response/user-make-payment.response';

export function UserMakePaymentDocumentation() {
    return applyDecorators(
        ApiOperation({ summary: 'Оплата заказа гостем' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: MakePaymentDto,
            description: 'Структура входных данных для оплаты заказа',
        }),
        ApiResponse({
            description: 'Payment order',
            status: HttpStatus.CREATED,
            type: UserMakePaymentResponse,
        }),
    );
}
