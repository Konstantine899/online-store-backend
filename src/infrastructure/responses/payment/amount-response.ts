import { ApiProperty } from '@nestjs/swagger';

interface IAmountResponse {
    value: string;
    currency: string;
}

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
