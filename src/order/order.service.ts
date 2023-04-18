import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { OrderModel } from './order.model';
import { OrderDto } from './dto/order.dto';
import { CartRepository } from '../cart/cart.repository';

@Injectable()
export class OrderService {
  constructor(
	private readonly orderRepository: OrderRepository,
	private readonly cartRepository: CartRepository,
  ) {}

  public async adminGetListOrdersStore(): Promise<OrderModel[]> {
	const orders = await this.orderRepository.adminFindListOrders();
	if (!orders.length) {
		this.notFound('Список заказов магазина пуст');
	}
	return orders;
  }

  public async adminGetListOrdersUser(userId: number): Promise<OrderModel[]> {
	const orders = await this.orderRepository.adminFindListOrders(userId);
	if (!orders.length) {
		this.notFound('Список заказов пользователя пуст');
	}
	return orders;
  }

  public async adminGetOrderUser(
	orderId: number,
	userId: number,
  ): Promise<OrderModel> {
	const order = await this.orderRepository.adminFindOrderUser(
		orderId,
		userId,
	);
	if (!order) {
		this.notFound('Заказ не найден');
	}
	return order;
  }

  public async adminCreateOrder(dto: OrderDto): Promise<OrderModel> {
	const userAndHisOrders = await this.orderRepository.findUserAndHisOrders(
		dto.userId,
	);
	// Если у пользователя нет заказа, то создаю его
	if (!userAndHisOrders) {
		return this.orderRepository.adminCreateOrder(dto);
	}
	// Если у пользователя есть заказ, то просто возвращаю заказ
	return userAndHisOrders;
  }

  public async adminDeleteOrder(orderId: number): Promise<boolean> {
	const order = await this.orderRepository.findOrder(orderId);
	if (!order) {
		this.notFound(`Заказ не найден`);
	}
	return this.orderRepository.destroyOrder(order);
  }

  public async userGetListOrders(userId): Promise<OrderModel[]> {
	const orders = await this.orderRepository.userFindListOrders(userId);
	if (!orders) {
		this.notFound(`Заказ не найден`);
	}
	return orders;
  }

  public async userGetOrder(
	orderId: number,
	userId: number,
  ): Promise<OrderModel> {
	const order = await this.orderRepository.userFindOrder(orderId, userId);
	if (!order) {
		this.notFound(`Заказ не найден`);
	}
	return order;
  }

  /*Авторизованный и не авторизованный пользователи могут делать заказ*/
  /*Состав заказа мы получаем из корзины которая находится в cookie(если пользователь авторизован)*/
  /*Если пользователь авторизован то userId получаю из access token*/
  public async userCreateOrder(
	dto: OrderDto,
	userId?: number,
	cartId?: number,
  ): Promise<OrderModel> {
	if (!cartId) { this.notFound(`Ваша корзина пуста`); }
	const cart = await this.cartRepository.findCart(cartId);
	if (cart.products.length === 0) { this.notFound(`Ваша корзина пуста`); }
	/*Для создания заказа отправляю сформированный в клиентской части объект
     * который содержит в себе данные пользователя, и данные заказа с корзины*/
	const order = this.orderRepository.userCreateOrder(dto);
	// после оформления заказа корзину нужно очистить
	await this.cartRepository.clearCart(cartId);
	return order;
  }

  private notFound(message: string) {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
