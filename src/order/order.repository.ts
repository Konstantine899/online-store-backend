import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderModel } from './order.model';
import { OrderItemModel } from '../order-item/order-item.model';
import { OrderDto } from './dto/order.dto';
import { OrderItemRepository } from '../order-item/order-item.repository';
import { AdminGetListOfAllStoreOrdersResponse } from './requests/admin-get-list-of-all-store-orders.response';

@Injectable()
export class OrderRepository {
  constructor(
	@InjectModel(OrderModel) private orderModel: typeof OrderModel,
	private readonly orderItemRepository: OrderItemRepository,
  ) {}

  public async adminFindListOrders(
	userId?: number,
  ): Promise<AdminGetListOfAllStoreOrdersResponse[]> {
	let orders: OrderModel[];
	if (userId) {
		orders = await this.orderModel.findAll({ where: { userId } });
	} else {
		orders = await this.orderModel.findAll();
	}

	return orders;
  }

  public async adminFindOrderUser(
	id: number,
	userId?: number,
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

  public async findUserAndHisOrders(userId: number): Promise<OrderModel> {
	return this.orderModel.findOne({
		where: { userId },
		include: [
		{
			model: OrderItemModel,
			as: 'items',
			attributes: ['name', 'price', 'quantity'],
		},
		],
	});
  }

  public async adminCreateOrder(dto: OrderDto): Promise<OrderModel> {
	return this.createOrder(dto);
  }

  public async findOrder(orderId: number): Promise<OrderModel> {
	return this.orderModel.findByPk(orderId, {
		include: [
		{
			model: OrderItemModel,
			as: `items`,
			attributes: ['name', 'price', 'quantity'],
		},
		],
	});
  }

  public async removeOrder(id: number): Promise<number> {
	return this.orderModel.destroy({ where: { id } });
  }

  public async userFindListOrders(userId: number): Promise<OrderModel[]> {
	let orders: OrderModel[];
	if (userId) {
		orders = await this.orderModel.findAll({
		where: { userId },
		include: [
			{
			model: OrderItemModel,
			as: `items`,
			attributes: ['name', 'price', 'quantity'],
			},
		],
		});
	} else {
		orders = await this.orderModel.findAll();
	}

	return orders;
  }

  public async userFindOrder(
	orderId: number,
	userId?: number,
  ): Promise<OrderModel> {
	return this.orderModel.findOne({
		where: { userId, id: orderId },
		include: [
		{
			model: OrderItemModel,
			as: `items`,
			attributes: ['name', 'price', 'quantity'],
		},
		],
	});
  }

  public async createOrder(
	dto: Omit<OrderDto, 'userId'>,
	userId?: number,
  ): Promise<OrderModel> {
	const order: OrderModel = new OrderModel();
	order.userId = userId;
	order.name = dto.name;
	order.email = dto.email;
	order.phone = dto.phone;
	order.address = dto.address;
	order.comment = dto.comment;
	order.amount = dto.items.reduce(
		(sum: number, item: OrderItemModel) => sum + item.price * item.quantity,
		0,
	);
	await order.save();
	for (const item of dto.items) {
		await this.orderItemRepository.createItem(order.id, item);
	}

	return this.orderModel.findByPk(order.id, {
		include: [
		{
			model: OrderItemModel,
			as: `items`,
			attributes: ['name', 'price', 'quantity'],
		},
		],
	});
  }
}
