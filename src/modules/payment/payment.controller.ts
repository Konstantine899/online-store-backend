import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MakePaymentDto } from './dto/make-payment.dto';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { RoleGuard } from '../role/role.guard';
import { UserMakePaymentResponse } from './responses/user-make-payment.response';
import { GuestMakePaymentResponse } from './responses/guest-make-payment.response';
import { ApiTags } from '@nestjs/swagger';
import { GuestMakePaymentSwaggerDecorator } from './decorators/guest-make-payment-swagger-decorator';
import { UserMakePaymentSwaggerDecorator } from './decorators/user-make-payment-swagger-decorator';
import { AuthGuard } from '../auth/auth.guard';

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
