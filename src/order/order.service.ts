import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  public async adminGetListAllOrder() {
	const listAllOrders = await this.orderRepository.adminFindListAllOrders();
	if (!listAllOrders.length) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Список заказов пуст',
		});
	}
	return listAllOrders;
  }
}
