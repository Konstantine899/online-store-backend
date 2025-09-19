import { ApiProperty } from '@nestjs/swagger';
import { IConfirmationResponse } from '@app/domain/responses';

export class ConfirmationResponse implements IConfirmationResponse {
    @ApiProperty({
        example: 'redirect',
        description: 'Тип редирект',
    })
    declare type: string;

    @ApiProperty({
        example:
            'https://yoomoney.ru/checkout/payments/v2/contract?orderId=2c127204-000f-5000-8000-1fea3fd6f83e',
        description: 'URL на который происходит редирект',
    })
    declare confirmation_url: string;
}
