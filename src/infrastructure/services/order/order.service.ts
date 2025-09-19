import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { OrderDto } from '@app/infrastructure/dto';
import {
    CartRepository,
    OrderRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import { UserService } from '../user/user.service';
import {
    AdminGetStoreOrderListResponse,
    AdminGetOrderUserResponse,
    AdminGetOrderListUserResponse,
    AdminCreateOrderResponse,
    AdminRemoveOrderResponse,
    UserGetOrderListResponse,
    UserCreateOrderResponse,
    UserGetOrderResponse,
    GuestCreateOrderResponse,
} from '@app/infrastructure/responses';
import { IOrderService } from '@app/domain/services';

@Injectable()
export class OrderService implements IOrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly cartRepository: CartRepository,
        private readonly userService: UserService,
        private readonly userRepository: UserRepository,
    ) {}

    public async adminGetStoreOrderList(): Promise<
        AdminGetStoreOrderListResponse[]
    > {
        const orders = await this.orderRepository.adminFindOrderListUser();
        if (!orders.length) {
            this.notFound('Список заказов магазина пуст');
        }
        return orders as AdminGetStoreOrderListResponse[];
    }

    public async adminGetOrderListUser(
        userId: number,
    ): Promise<AdminGetOrderListUserResponse[]> {
        const user = await this.userRepository.findUserByPkId(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const orders = await this.orderRepository.adminFindOrderListUser(
            user.id,
        );
        if (!orders.length) {
            this.notFound(
                `Список заказов пользователя email: ${user.email} пуст`,
            );
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
        if (dto.userId === undefined) {
            throw new Error('userId обязательно для создания заказа');
        }
        const userAndHisOrders =
            await this.orderRepository.findUserAndHisOrders(dto.userId);
        // Если у пользователя нет заказа, то создаю его
        if (!userAndHisOrders) {
            return this.orderRepository.adminCreateOrder(dto);
        }
        // Если у пользователя есть заказ, то просто возвращаю заказ
        return userAndHisOrders;
    }

    public async adminRemoveOrder(
        orderId: number,
    ): Promise<AdminRemoveOrderResponse> {
        const order = await this.orderRepository.findOrder(orderId);
        if (!order) {
            this.notFound('Заказ не найден');
        }
        await this.orderRepository.removeOrder(order.id);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    public async userGetOrderList(
        userId: number,
    ): Promise<UserGetOrderListResponse[]> {
        const orders = await this.orderRepository.userFindOrderList(userId);
        if (!orders.length) {
            this.notFound('Заказы не найдены');
        }
        return orders;
    }

    public async userGetOrder(
        orderId: number,
        userId: number,
    ): Promise<UserGetOrderResponse> {
        const order = await this.orderRepository.userFindOrder(orderId, userId);
        if (!order) {
            this.notFound('Заказ не найден');
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
    ): Promise<UserCreateOrderResponse> {
        return this.createOrder(dto, userId, cartId);
    }

    public async guestCreateOrder(
        dto: OrderDto,
        userId?: number,
        cartId?: number,
    ): Promise<GuestCreateOrderResponse> {
        if (userId === undefined || cartId === undefined) {
            throw new Error('userId и cartId обязательны для создания заказа');
        }
        return this.createOrder(dto, userId, cartId);
    }

    private async createOrder(
        dto: Omit<OrderDto, 'userId'>,
        userId: number,
        cartId: number,
    ): Promise<UserCreateOrderResponse> {
        /*Если есть userId ищем пользователя в БД. Если пользователь не найден выдаст исключение*/
        if (userId) {
            await this.userService.getUser(userId);
        }
        const cart = await this.cartRepository.findCart(cartId);
        if (!cart) {
            this.notFound(`Корзины с id:${cartId} не найдена БД`);
        }
        if (cart.products.length === 0) {
            this.notFound('Ваша корзина пуста');
        }
        /*Для создания заказа отправляю сформированный в клиентской части объект
         * который содержит в себе данные пользователя, и данные заказа с корзины*/
        const order = this.orderRepository.createOrder(dto, userId);
        // после оформления заказа корзину нужно очистить
        await this.cartRepository.clearCart(cartId);
        return order;
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
