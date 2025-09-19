import { ApiProperty } from '@nestjs/swagger';
import { AmountResponse } from './amount-response';
import { RecipientResponse } from './recipient-response';
import { ConfirmationResponse } from './confirmation-response';
import { GuestMetadataResponse } from './guest-metadata-response';
import { IGuestMakePaymentResponse } from '@app/domain/responses';

export class GuestMakePaymentResponse implements IGuestMakePaymentResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор заказа',
    })
    declare id: string;

    @ApiProperty({
        example: 'pending',
        description: 'Статус заказа',
    })
    declare status: string;

    @ApiProperty()
    declare amount: AmountResponse;

    @ApiProperty()
    declare recipient: RecipientResponse;

    @ApiProperty({
        example: '2023-06-07T10:39:00.236Z',
        description: 'Время оплаты',
    })
    declare created_at: string;

    @ApiProperty()
    declare confirmation: ConfirmationResponse;

    @ApiProperty({
        example: true,
        description: 'Тестова среда',
    })
    declare test: boolean;

    @ApiProperty({
        example: false,
        description: 'Оплаченный',
    })
    declare paid: boolean;

    @ApiProperty({
        example: false,
        description: 'Возмещаемый',
    })
    declare refundable: boolean;
    @ApiProperty()
    declare metadata: GuestMetadataResponse;
}
