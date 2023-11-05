import {
    AdminGetStoreOrderListResponse,
    AdminGetOrderListUserResponse,
    AdminCreateOrderResponse,
    AdminGetOrderUserResponse,
    UserGetOrderListResponse,
} from '@app/infrastructure/responses';
import { OrderDto } from '@app/infrastructure/dto';
import { OrderModel } from '@app/domain/models';

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
}
