import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MakePaymentDto } from './dto/make-payment.dto';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { GuestMakePaymentResponse } from './response/guest-make-payment.response';
import { UserMakePaymentResponse } from './response/user-make-payment.response';
import { ApiTags } from '@nestjs/swagger';
import { GuestMakePaymentSwaggerDecorator } from './decorators/guest-make-payment-swagger-decorator';
import { UserMakePaymentSwaggerDecorator } from './decorators/user-make-payment-swagger-decorator';

@ApiTags('Оплата')
@Controller('payment')
export class PaymentController {
    constructor(private paymentService: PaymentService) {}

    @UserMakePaymentSwaggerDecorator()
    @Roles('USER')
    @UseGuards(JwtGuard, RoleGuard)
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
