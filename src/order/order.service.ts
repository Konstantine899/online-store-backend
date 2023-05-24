import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { OrderModel } from './order.model';
import { OrderDto } from './dto/order.dto';
import { CartRepository } from '../cart/cart.repository';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { AdminGetListOfAllStoreOrdersResponse } from './requests/admin-get-list-of-all-store-orders.response';
import { AdminGetListOrdersUserResponse } from './requests/admin-get-list-orders-user.response';
import { AdminGetOrderUserResponse } from './requests/admin-get-order-user.response';
import { AdminCreateOrderResponse } from './requests/admin-create-order.response';

@Injectable()
export class OrderService {
  constructor(
	private readonly orderRepository: OrderRepository,
	private readonly cartRepository: CartRepository,
	private readonly userService: UserService,
	private readonly userRepository: UserRepository,
  ) {}

  public async adminGetListOfAllStoreOrders(): Promise<
	AdminGetListOfAllStoreOrdersResponse[]
  > {
	const orders = await this.orderRepository.adminFindListOrders();
	if (!orders.length) {
		this.notFound('Список заказов магазина пуст');
	}
	return orders;
  }

  public async adminGetListOrdersUser(
	userId: number,
  ): Promise<AdminGetListOrdersUserResponse[]> {
	const user = await this.userRepository.findUserByPkId(userId);
	if (!user) {
		this.notFound(`Пользователь не найден в БД`);
	}
	const orders = await this.orderRepository.adminFindListOrders(user.id);
	if (!orders.length) {
		this.notFound('Список заказов пользователя пуст');
	}
	return orders;
  }

  public async adminGetOrderUser(
	orderId: number,
  ): Promise<AdminGetOrderUserResponse> {
	const order = await this.orderRepository.adminFindOrderUser(orderId);
	if (!order) {
		this.notFound('Заказ не найден');
	}
	return order;
  }

  public async adminCreateOrder(
	dto: OrderDto,
  ): Promise<AdminCreateOrderResponse> {
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

  public async adminRemoveOrder(orderId: number): Promise<number> {
	const order = await this.orderRepository.findOrder(orderId);
	if (!order) {
		this.notFound(`Заказ не найден`);
	}
	return this.orderRepository.removeOrder(order.id);
  }

  public async userGetListOrders(userId): Promise<OrderModel[]> {
	const orders = await this.orderRepository.userFindListOrders(userId);
	if (!orders.length) {
		this.notFound(`Заказы не найдены`);
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
	dto: Omit<OrderDto, 'userId'>,
	userId: number,
	cartId: number,
  ): Promise<OrderModel> {
	return this.createOrder(dto, userId, cartId);
  }

  public async guestCreateOrder(
	dto: OrderDto,
	userId?: number,
	cartId?: number,
  ): Promise<OrderModel> {
	return this.createOrder(dto, userId, cartId);
  }

  private async createOrder(
	dto: Omit<OrderDto, 'userId'>,
	userId: number,
	cartId: number,
  ): Promise<OrderModel> {
	/*Если есть userId ищем пользователя в БД. Если пользователь не найден выдаст исключение*/
	if (userId) {
		await this.userService.getUser(userId);
	}
	const cart = await this.cartRepository.findCart(cartId);
	if (!cart) {
		this.notFound(`Корзины с id:${cartId} не найдена БД`);
	}
	if (cart.products.length === 0) {
		this.notFound(`Ваша корзина пуста`);
	}
	/*Для создания заказа отправляю сформированный в клиентской части объект
     * который содержит в себе данные пользователя, и данные заказа с корзины*/
	const order = this.orderRepository.createOrder(dto, userId);
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
