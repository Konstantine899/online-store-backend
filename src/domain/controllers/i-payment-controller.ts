import { MakePaymentDto } from '@app/infrastructure/dto';
import {
    UserMakePaymentResponse,
    GuestMakePaymentResponse,
} from '@app/infrastructure/responses';

export interface IPaymentController {
    userMakePayment(
        makePaymentDto: MakePaymentDto,
    ): Promise<UserMakePaymentResponse>;

    guestMakePayment(
        makePaymentDto: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse>;
}
