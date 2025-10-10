import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { MakePaymentDto } from '@app/infrastructure/dto';
import axios from 'axios';
import {
    GuestMakePaymentResponse,
    UserMakePaymentResponse,
} from '@app/infrastructure/responses';
import { IPaymentService } from '@app/domain/services';

@Injectable()
export class PaymentService implements IPaymentService {
    public async userMakePayment(
        makePayment: MakePaymentDto,
    ): Promise<UserMakePaymentResponse> {
        return this.makePayment(makePayment);
    }

    public async guestMakePayment(
        makePayment: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse> {
        return this.makePayment(makePayment);
    }

    private async makePayment(
        makePaymentDto: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse | UserMakePaymentResponse> {
        try {
            // TEST-032: Fix idempotency key to prevent double-charge
            // OLD: Date.now() - всегда разный!
            // NEW: deterministic key based on order
            const idempotenceKey = `order-${makePaymentDto.orderId || 'unknown'}-payment`;

            const { data } = await axios({
                method: 'POST',
                url: 'https://api.yookassa.ru/v3/payments',
                headers: {
                    '217532':
                        'test_2WFQT8WqcG0OE8CrNvwESbkcOc8dsZwD4RnVf5RkwYw',
                    'Content-Type': 'application/json',
                    'Idempotence-Key': idempotenceKey,
                },
                auth: {
                    username: '217532',
                    password:
                        'test_2WFQT8WqcG0OE8CrNvwESbkcOc8dsZwD4RnVf5RkwYw',
                },
                data: {
                    amount: {
                        value: makePaymentDto.amount,
                        currency: 'RUB',
                    },
                    capture: true,
                    confirmation: {
                        type: 'redirect',
                        return_url: 'http://localhost:5000/online-store/order',
                    },
                },
            });
            return data;
        } catch (error) {
            throw new ForbiddenException({
                status: HttpStatus.FORBIDDEN,
                error: error,
            });
        }
    }
}
