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
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '../token/jwt.guard';
import { IDecodedPayload, RoleGuard } from '../role/role.guard';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { OrderDto } from './dto/order.dto';
import { Request } from 'express';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /*Для администратора*/

  /*Получение списка всех заказов магазина*/
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/admin/get-all-order')
  public async adminGetListOrdersStore() {
	return this.orderService.adminGetListOrdersStore();
  }

  /*Получение списка заказов пользователя*/
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/admin/get-all-order/user/:userId([0-9]+)')
  public async adminGetListOrdersUser(
	@Param('userId', ParseIntPipe) userId: number,
  ) {
	return this.orderService.adminGetListOrdersUser(userId);
  }

  /*Получение заказа пользователя по id заказа*/
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/admin/get-order/:orderId([0-9]+)')
  public async adminGetOrderUser(
	@Body() dto: OrderDto,
	@Param('orderId', ParseIntPipe) orderId: number,
  ) {
	return this.orderService.adminGetOrderUser(orderId, dto.userId);
  }

  /*Создание заказа для пользователя администратором*/
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Post(`/admin/create-order`)
  public async adminCreateOrder(@Body() dto: OrderDto) {
	return this.orderService.adminCreateOrder(dto);
  }

  /*Администратор Удаление заказа*/
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Delete('/admin/delete-order/:orderId([0-9]+)')
  public async adminDeleteOrder(
	@Param('orderId', ParseIntPipe) orderId: number,
  ) {
	return this.orderService.adminDeleteOrder(orderId);
  }

  /*Для авторизованного пользователя*/

  /*Получение списка заказов пользователя*/
  @HttpCode(200)
  @Roles('USER')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get(`/user/get-all-order`)
  public async userGetListOrders(@Req() request: Request) {
	const { id }: IDecodedPayload = request.user;
	return this.orderService.userGetListOrders(id);
  }

  /*Получение одного заказа пользователя*/

  @HttpCode(200)
  @Roles('USER')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get(`/user/get-order/:orderId([0-9]+)`)
  public async userGetOrder(
	@Req() request: Request,
	@Param('orderId', ParseIntPipe) orderId: number,
  ) {
	const { id }: IDecodedPayload = request.user;
	return this.orderService.userGetOrder(orderId, id);
  }
}
