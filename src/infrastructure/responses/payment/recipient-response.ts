import { ApiProperty } from '@nestjs/swagger';
import { IRecipientResponse } from '@app/domain/responses';

export class RecipientResponse implements IRecipientResponse {
    @ApiProperty({
        example: '111111',
        description: 'Идентификатор аккаунта',
    })
    declare account_id: string;

    @ApiProperty({
        example: '1111111',
        description: 'Идентификатор шлюза',
    })
    declare gateway_id: string;
}
