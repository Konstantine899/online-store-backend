import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { MakePaymentDto } from '../../dto/payment/make.payment.dto';
import axios from 'axios';
import { GuestMakePaymentResponse } from '../../responses/payment/guest-make-payment.response';
import { UserMakePaymentResponse } from '../../responses/payment/user-make-payment.response';
import { IPaymentService } from '../../../domain/services/payment/i-payment-service';

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
            const { data } = await axios({
                method: 'POST',
                url: 'https://api.yookassa.ru/v3/payments',
                headers: {
                    '217532':
                        'test_2WFQT8WqcG0OE8CrNvwESbkcOc8dsZwD4RnVf5RkwYw',
                    'Content-Type': 'application/json',
                    'Idempotence-Key': Date.now(),
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
