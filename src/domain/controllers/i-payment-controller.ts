import { MakePaymentDto } from '@app/infrastructure/dto';
import { UserMakePaymentResponse } from '../../infrastructure/responses/payment/user-make-payment.response';
import { GuestMakePaymentResponse } from '../../infrastructure/responses/payment/guest-make-payment.response';

export interface IPaymentController {
    userMakePayment(
        makePaymentDto: MakePaymentDto,
    ): Promise<UserMakePaymentResponse>;

    guestMakePayment(
        makePaymentDto: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse>;
}
