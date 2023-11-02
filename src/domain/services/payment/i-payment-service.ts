import { MakePaymentDto } from '../../../infrastructure/dto/payment/make.payment.dto';
import { UserMakePaymentResponse } from '../../../infrastructure/responses/payment/user-make-payment.response';
import { GuestMakePaymentResponse } from '../../../infrastructure/responses/payment/guest-make-payment.response';

export interface IPaymentService {
    userMakePayment(
        makePayment: MakePaymentDto,
    ): Promise<UserMakePaymentResponse>;

    guestMakePayment(
        makePayment: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse>;
}
