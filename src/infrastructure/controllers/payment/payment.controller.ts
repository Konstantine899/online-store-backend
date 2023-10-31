import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from '../../services/payment/payment.service';
import { MakePaymentDto } from '../../dto/payment/make.payment.dto';
import { Roles } from '../../common/decorators/roles-auth.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserMakePaymentResponse } from '../../responses/payment/user-make-payment.response';
import { GuestMakePaymentResponse } from '../../responses/payment/guest-make-payment.response';
import { ApiTags } from '@nestjs/swagger';
import { GuestMakePaymentSwaggerDecorator } from '../../common/decorators/swagger/payment/guest-make-payment-swagger-decorator';
import { UserMakePaymentSwaggerDecorator } from '../../common/decorators/swagger/payment/user-make-payment-swagger-decorator';
import { AuthGuard } from '../../common/guards/auth.guard';

interface IPaymentController {
    userMakePayment(
        makePaymentDto: MakePaymentDto,
    ): Promise<UserMakePaymentResponse>;

    guestMakePayment(
        makePaymentDto: MakePaymentDto,
    ): Promise<GuestMakePaymentResponse>;
}

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
