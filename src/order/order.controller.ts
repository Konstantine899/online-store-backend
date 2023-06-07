import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { OrderDto } from './dto/order.dto';
import { Request } from 'express';
import { AdminGetStoreOrderListDocumentation } from './decorators/admin-get-store-order-list.documentation';
import { ApiTags } from '@nestjs/swagger';
import { AdminGetOrderListUserDocumentation } from './decorators/admin-get-order-list-user.documentation';
import { AdminGetOrderUserDocumentation } from './decorators/admin-get-order-user.documentation';
import { AdminCreateOrderDocumentation } from './decorators/admin-create-order.documentation';
import { AdminRemoveOrderDocumentation } from './decorators/admin-remove-order.documentation';
import { RequestUserDto } from './dto/request-user.dto';
import { RequestSignedCookiesDto } from './dto/request-signed-cookies.dto';
import { UserCreateOrderDocumentation } from './decorators/user-create-order.documentation';
import { UserGetOrderDocumentation } from './decorators/user-get-order.documentation';
import { UserGetOrderListDocumentation } from './decorators/user-get-order-list.documentation';
import { GuestCreateOrderDocumentation } from './decorators/guest-create-order.documentation';
import { AdminGetStoreOrderListResponse } from './response/admin-get-store-order-list.response';
import { AdminGetOrderListUserResponse } from './response/admin-get-order-list-user.response';
import { AdminGetOrderUserResponse } from './response/admin-get-order-user.response';
import { AdminCreateOrderResponse } from './response/admin-create-order.response';
import { AdminRemoveOrderResponse } from './response/admin-remove-order.response';
import { UserGetOrderListResponse } from './response/user-get-order-list.response';
import { UserGetOrderResponse } from './response/user-get-order.response';
import { UserCreateOrderResponse } from './response/user-create-order.response';
import { GuestCreateOrderResponse } from './response/guest-create-order.response';
import { TransactionInterceptor } from '../interceptors/transaction-interceptor';
import { TransactionDecorator } from '../decorators/transaction-decorator';
import { Transaction } from 'sequelize';

@ApiTags(`Заказы`)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /*Для администратора*/

  /*Получение списка всех заказов магазина*/
  @AdminGetStoreOrderListDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('/admin/get-all-order')
  @UseInterceptors(TransactionInterceptor)
  public async adminGetStoreOrderList(
	@TransactionDecorator() transaction: Transaction,
  ): Promise<AdminGetStoreOrderListResponse[]> {
	return this.orderService.adminGetStoreOrderList();
  }

  /*Получение списка заказов пользователя*/
  @AdminGetOrderListUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('/admin/get-all-order/user/:userId([0-9]+)')
  @UseInterceptors(TransactionInterceptor)
  public async adminGetOrderListUser(
	@Param('userId', ParseIntPipe) userId: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<AdminGetOrderListUserResponse[]> {
	return this.orderService.adminGetOrderListUser(userId);
  }

  /*Получение заказа пользователя по id заказа*/
  @AdminGetOrderUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('/admin/get-order/:orderId([0-9]+)')
  @UseInterceptors(TransactionInterceptor)
  public async adminGetOrderUser(
	@Param('orderId', ParseIntPipe) orderId: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<AdminGetOrderUserResponse> {
	return this.orderService.adminGetOrderUser(orderId);
  }

  /*Создание заказа для пользователя администратором*/
  @AdminCreateOrderDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post(`/admin/create-order`)
  @UseInterceptors(TransactionInterceptor)
  public async adminCreateOrder(
	@Body() dto: OrderDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<AdminCreateOrderResponse> {
	return this.orderService.adminCreateOrder(dto);
  }

  /*Администратор Удаление заказа*/
  @AdminRemoveOrderDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/admin/delete-order/:orderId([0-9]+)')
  @UseInterceptors(TransactionInterceptor)
  public async adminRemoveOrder(
	@Param('orderId', ParseIntPipe) orderId: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<AdminRemoveOrderResponse> {
	return this.orderService.adminRemoveOrder(orderId);
  }

  /*Для авторизованного пользователя*/

  /*Получение списка заказов пользователя*/
  @UserGetOrderListDocumentation()
  @HttpCode(200)
  @Roles('USER')
  @UseGuards(JwtGuard, RoleGuard)
  @Get(`/user/get-all-order`)
  @UseInterceptors(TransactionInterceptor)
  public async userGetOrderList(
	@Req() request: Request,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<UserGetOrderListResponse[]> {
	const { id } = request.user as RequestUserDto;
	return this.orderService.userGetOrderList(id);
  }

  /*Получение одного заказа пользователя*/
  @UserGetOrderDocumentation()
  @HttpCode(200)
  @Roles('USER')
  @UseGuards(JwtGuard, RoleGuard)
  @Get(`/user/get-order/:orderId([0-9]+)`)
  @UseInterceptors(TransactionInterceptor)
  public async userGetOrder(
	@Req() request: Request,
	@Param('orderId', ParseIntPipe) orderId: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<UserGetOrderResponse> {
	const { id } = request.user as RequestUserDto;
	return this.orderService.userGetOrder(orderId, id);
  }

  @UserCreateOrderDocumentation()
  @HttpCode(201)
  @Roles('USER')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/user/create-order')
  @UseInterceptors(TransactionInterceptor)
  public async userCreateOrder(
	@Req() request: Request,
	@Body() dto: Omit<OrderDto, 'userId'>,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<UserCreateOrderResponse> {
	const { id } = request.user as RequestUserDto;
	const { cartId } = request.signedCookies as RequestSignedCookiesDto;
	return this.orderService.userCreateOrder(dto, id, cartId);
  }

  /*Для не авторизованного пользователя*/

  @GuestCreateOrderDocumentation()
  @HttpCode(201)
  @Post('/guest/create-order')
  @UseInterceptors(TransactionInterceptor)
  public async guestCreateOrder(
	@Req() request: Request,
	@Body() dto: OrderDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<GuestCreateOrderResponse> {
	const { cartId } = request.signedCookies;
	return this.orderService.guestCreateOrder(dto, undefined, cartId);
  }
}
