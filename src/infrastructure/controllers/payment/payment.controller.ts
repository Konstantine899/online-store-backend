import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from '../../services/payment/payment.service';
import { MakePaymentDto } from '@app/infrastructure/dto';
import {
    Roles,
    GuestMakePaymentSwaggerDecorator,
    UserMakePaymentSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { UserMakePaymentResponse } from '../../responses/payment/user-make-payment.response';
import { GuestMakePaymentResponse } from '../../responses/payment/guest-make-payment.response';
import { ApiTags } from '@nestjs/swagger';
import { IPaymentController } from '@app/domain/controllers';

@ApiTags('Оплата')
@Controller('payment')
export class PaymentController implements IPaymentController {
    constructor(private paymentService: PaymentService) {}

    @UserMakePaymentSwaggerDecorator()
    @Roles('USER')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/user/make-payment')
    async userMakePayment(
        @Body() makePaymentDto: MakePaymentDto,
    ): Promise<UserMakePaymentResponse> {
        return this.paymentService.userMakePayment(makePaymentDto);
    }

    @GuestMakePaymentSwaggerDecorator()
    @Post('/guest/make-payment')
    async guestMakePayment(
        @Body() makePaymentDto: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse> {
        return this.paymentService.guestMakePayment(makePaymentDto);
    }
}
