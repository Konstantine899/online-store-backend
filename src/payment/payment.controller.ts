import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MakePaymentDto } from './dto/make-payment.dto';
import { TransactionInterceptor } from '../interceptors/transaction-interceptor';
import { TransactionDecorator } from '../decorators/transaction-decorator';
import { Transaction } from 'sequelize';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { GuestMakePaymentResponse } from './response/guest-make-payment.response';
import { UserMakePaymentResponse } from './response/user-make-payment.response';
import { ApiTags } from '@nestjs/swagger';
import { GuestMakePaymentDocumentation } from './decorators/guest-make-payment.documentation';
import { UserMakePaymentDocumentation } from './decorators/user-make-payment.documentation';

@ApiTags(`Оплата`)
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UserMakePaymentDocumentation()
  @Roles('USER')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/user/make-payment')
  @UseInterceptors(TransactionInterceptor)
  async userMakePayment(
	@Body() makePaymentDto: MakePaymentDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<UserMakePaymentResponse> {
	return this.paymentService.userMakePayment(makePaymentDto);
  }

  @GuestMakePaymentDocumentation()
  @Post('/guest/make-payment')
  @UseInterceptors(TransactionInterceptor)
  async guestMakePayment(
	@Body() makePaymentDto: MakePaymentDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<GuestMakePaymentResponse> {
	return this.paymentService.guestMakePayment(makePaymentDto);
  }
}
