import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { Roles } from '../auth/decorators/roles-auth.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  /*Для администратора*/
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/admin/get-all-order')
  public async adminGetListAllOrder() {
	return this.orderService.adminGetListAllOrder();
  }
}
