import type { MakePaymentDto } from '@app/infrastructure/dto';
import type {
    UserMakePaymentResponse,
    GuestMakePaymentResponse,
} from '@app/infrastructure/responses';

export interface IPaymentService {
    userMakePayment(
        makePayment: MakePaymentDto,
    ): Promise<UserMakePaymentResponse>;

    guestMakePayment(
        makePayment: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse>;
}
