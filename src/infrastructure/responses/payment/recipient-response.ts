import { ApiProperty } from '@nestjs/swagger';

interface IRecipientResponse {
    account_id: string;
    gateway_id: string;
}

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
