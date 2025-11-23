import type {
    AdminGetStoreOrderListResponse,
    AdminGetOrderListUserResponse,
    AdminCreateOrderResponse,
    AdminGetOrderUserResponse,
    UserGetOrderListResponse,
} from '@app/infrastructure/responses';
import type { OrderDto } from '@app/infrastructure/dto';
import type { OrderModel } from '@app/domain/models';

export interface IOrderRepository {
    adminFindOrderListUser(
        user_id?: number,
    ): Promise<
        AdminGetStoreOrderListResponse[] | AdminGetOrderListUserResponse[]
    >;

    adminFindOrderUser(
        id: number,
        user_id?: number,
    ): Promise<AdminGetOrderUserResponse>;

    findUserAndHisOrders(user_id: number): Promise<AdminCreateOrderResponse>;

    adminCreateOrder(dto: OrderDto): Promise<AdminCreateOrderResponse>;

    findOrder(orderId: number): Promise<OrderModel>;

    removeOrder(id: number): Promise<number>;

    userFindOrderList(user_id: number): Promise<UserGetOrderListResponse[]>;

    userFindOrder(order_id: number, user_id?: number): Promise<OrderModel>;

    createOrder(
        dto: Omit<OrderDto, 'userId'>,
        userId: number,
    ): Promise<OrderModel>;

    /**
     * Получить общую сумму покупок пользователя
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Сумма всех заказов пользователя в рублях
     */
    getUserTotalSpent(
        userId: number,
        tenantId: number,
    ): Promise<number>;

    /**
     * Получить количество заказов пользователя
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Количество заказов пользователя
     */
    getUserOrderCount(
        userId: number,
        tenantId: number,
    ): Promise<number>;
}
