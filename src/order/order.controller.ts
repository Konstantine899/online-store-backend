import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { Roles } from '../auth/decorators/roles-auth.decorator';

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
}
