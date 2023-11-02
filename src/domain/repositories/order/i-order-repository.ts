import { AdminGetStoreOrderListResponse } from '../../../infrastructure/responses/order/admin-get-store-order-list.response';
import { AdminGetOrderListUserResponse } from '../../../infrastructure/responses/order/admin-get-order-list-user.response';
import { AdminGetOrderUserResponse } from '../../../infrastructure/responses/order/admin-get-order-user.response';
import { AdminCreateOrderResponse } from '../../../infrastructure/responses/order/admin-create-order.response';
import { OrderDto } from '../../../infrastructure/dto/order/order.dto';
import { OrderModel } from '../../models/order.model';
import { UserGetOrderListResponse } from '../../../infrastructure/responses/order/user-get-order-list.response';

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
