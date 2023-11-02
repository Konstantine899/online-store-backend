import { ApiProperty } from '@nestjs/swagger';
import { IAmountResponse } from '../../../domain/responses/payment/i-amount-response';

export class AmountResponse implements IAmountResponse {
    @ApiProperty({
        example: '1000,00',
        description: 'Цена',
    })
    value: string;

    @ApiProperty({
        example: 'RUB',
        description: 'Валюта',
    })
    currency: string;
}
