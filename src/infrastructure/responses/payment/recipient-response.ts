import { ApiProperty } from '@nestjs/swagger';
import { IRecipientResponse } from '../../../domain/responses/payment/i-recipient-response';

export class RecipientResponse implements IRecipientResponse {
    @ApiProperty({
        example: '111111',
        description: 'Идентификатор аккаунта',
    })
    account_id: string;

    @ApiProperty({
        example: '1111111',
        description: 'Идентификатор шлюза',
    })
    gateway_id: string;
}
