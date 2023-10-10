import { ApiProperty } from '@nestjs/swagger';

class Amount {
    @ApiProperty({ example: '1000,00', description: 'Цена' })
    value: string;

    @ApiProperty({ example: 'RUB', description: 'Валюта' })
    currency: string;
}

class Recipient {
    @ApiProperty({ example: '111111', description: 'Идентификатор аккаунта' })
    account_id: string;

    @ApiProperty({ example: '1111111', description: 'Идентификатор шлюза' })
    gateway_id: string;
}

class Confirmation {
    @ApiProperty({ example: 'redirect', description: 'Тип редирект' })
    type: string;

    @ApiProperty({
        example:
            'https://yoomoney.ru/checkout/payments/v2/contract?orderId=2c127204-000f-5000-8000-1fea3fd6f83e',
        description: 'URL на который происходит редирект',
    })
    confirmation_url: string;
}

class Metadata {}
export class UserMakePaymentResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор заказа' })
    id: string;

    @ApiProperty({ example: 'pending', description: 'Статус заказа' })
    status: string;

    @ApiProperty()
    amount: Amount;

    @ApiProperty()
    recipient: Recipient;

    @ApiProperty({
        example: '2023-06-07T10:39:00.236Z',
        description: 'Время оплаты',
    })
    'created_at': string;

    @ApiProperty()
    confirmation: Confirmation;

    @ApiProperty({ example: true, description: 'Тестова среда' })
    test: boolean;

    @ApiProperty({ example: false, description: 'Оплаченный' })
    paid: boolean;

    @ApiProperty({ example: false, description: 'Возмещаемый' })
    refundable: boolean;
    @ApiProperty()
    metadata: Metadata;
}
