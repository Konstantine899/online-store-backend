import { ApiProperty } from '@nestjs/swagger';
import { IAmountResponse } from '@app/domain/responses';

export class AmountResponse implements IAmountResponse {
    @ApiProperty({
        example: '1000,00',
        description: 'Цена',
    })
    declare value: string;

    @ApiProperty({
        example: 'RUB',
        description: 'Валюта',
    })
    declare currency: string;
}
