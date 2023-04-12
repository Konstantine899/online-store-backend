import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderModel } from './order.model';
import { OrderItemModel } from '../order-item/order-item.model';

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

  public async adminFindUserOrderById(
	id: number,
	userId: number,
  ): Promise<OrderModel> {
	let order: OrderModel;
	if (userId) {
		order = await this.orderModel.findOne({
		where: { id, userId },
		include: [
			{
			model: OrderItemModel,
			as: 'items',
			attributes: ['name', 'price', 'quantity'],
			},
		],
		});
		return order;
	}
	order = await this.orderModel.findByPk(id, {
		include: [
		{
			model: OrderItemModel,
			as: 'items',
			attributes: ['name', 'price', 'quantity'],
		},
		],
	});
	return order;
  }
}
