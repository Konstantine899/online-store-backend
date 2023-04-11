import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  public async adminGetListAllOrder() {
	const orders = await this.orderRepository.adminFindListOrders();
	if (!orders.length) { this.notFound('Список заказов магазина пуст'); }
	return orders;
  }

  public async adminGetListOrdersByUserId(userId: number) {
	const orders = await this.orderRepository.adminFindListOrders(userId);
	if (!orders.length) { this.notFound('Список заказов пользователя пуст'); }
	return orders;
  }

  private notFound(message: string) {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
