import { ApiProperty } from '@nestjs/swagger';
import { IConfirmationResponse } from '../../../domain/responses/payment/i-confirmation-response';

export class ConfirmationResponse implements IConfirmationResponse {
    @ApiProperty({
        example: 'redirect',
        description: 'Тип редирект',
    })
    type: string;

    @ApiProperty({
        example:
            'https://yoomoney.ru/checkout/payments/v2/contract?orderId=2c127204-000f-5000-8000-1fea3fd6f83e',
        description: 'URL на который происходит редирект',
    })
    confirmation_url: string;
}
