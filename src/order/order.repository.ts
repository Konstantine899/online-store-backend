import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderModel } from './order.model';

@Injectable()
export class OrderRepository {
  constructor(@InjectModel(OrderModel) private orderModel: typeof OrderModel) {}

  public async adminFindListOrders(userId?: number): Promise<OrderModel[]> {
	let orders: OrderModel[];
	if (userId) {
		orders = await this.orderModel.findAll({ where: { userId } });
	} else {
		orders = await this.orderModel.findAll();
	}

	return orders;
  }
}
