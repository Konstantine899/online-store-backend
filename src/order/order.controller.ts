import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { OrderDto } from './dto/order.dto';

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
  public async adminGetListAllOrder() {
	return this.orderService.adminGetListAllOrder();
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/admin/get-all-order/user/:userId([0-9]+)')
  public async adminGetListOrdersByUserId(
	@Param('userId', ParseIntPipe) userId: number,
  ) {
	return this.orderService.adminGetListOrdersByUserId(userId);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/admin/get-order/:orderId([0-9]+)')
  public async adminGetUserOrderById(
	@Body() dto: OrderDto,
	@Param('orderId', ParseIntPipe) orderId: number,
  ) {
	return this.orderService.adminGetUserOrderById(orderId, dto.userId);
  }

  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Post(`/admin/create-order`)
  public async adminCreateOrder(@Body() dto: OrderDto) {
	return this.orderService.adminCreateOrder(dto);
  }

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
}
