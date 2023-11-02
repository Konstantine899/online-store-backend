import { ApiProperty } from '@nestjs/swagger';
import { AmountResponse } from './amount-response';
import { RecipientResponse } from './recipient-response';
import { ConfirmationResponse } from './confirmation-response';
import { UserMetadataResponse } from './user-metadata-response';
import { IUserMakePaymentResponse } from '../../../domain/responses/payment/i-user-make-payment-response';

export class UserMakePaymentResponse implements IUserMakePaymentResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор заказа',
    })
    id: string;

    @ApiProperty({
        example: 'pending',
        description: 'Статус заказа',
    })
    status: string;

    @ApiProperty()
    amount: AmountResponse;

    @ApiProperty()
    recipient: RecipientResponse;

    @ApiProperty({
        example: '2023-06-07T10:39:00.236Z',
        description: 'Время оплаты',
    })
    created_at: string;

    @ApiProperty()
    confirmation: ConfirmationResponse;

    @ApiProperty({
        example: true,
        description: 'Тестова среда',
    })
    test: boolean;

    @ApiProperty({
        example: false,
        description: 'Оплаченный',
    })
    paid: boolean;

    @ApiProperty({
        example: false,
        description: 'Возмещаемый',
    })
    refundable: boolean;
    @ApiProperty()
    metadata: UserMetadataResponse;
}
