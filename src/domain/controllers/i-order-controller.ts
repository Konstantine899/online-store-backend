import { AdminGetStoreOrderListResponse } from '../../infrastructure/responses/order/admin-get-store-order-list.response';
import { AdminGetOrderListUserResponse } from '../../infrastructure/responses/order/admin-get-order-list-user.response';
import { AdminGetOrderUserResponse } from '../../infrastructure/responses/order/admin-get-order-user.response';
import { OrderDto } from '@app/infrastructure/dto';
import { AdminCreateOrderResponse } from '../../infrastructure/responses/order/admin-create-order.response';
import { AdminRemoveOrderResponse } from '../../infrastructure/responses/order/admin-remove-order.response';
import { Request } from 'express';
import { UserGetOrderListResponse } from '../../infrastructure/responses/order/user-get-order-list.response';
import { UserGetOrderResponse } from '../../infrastructure/responses/order/user-get-order.response';
import { UserCreateOrderResponse } from '../../infrastructure/responses/order/user-create-order.response';
import { GuestCreateOrderResponse } from '../../infrastructure/responses/order/guest-create-order.response';

export interface IOrderController {
    adminGetStoreOrderList(): Promise<AdminGetStoreOrderListResponse[]>;

    adminGetOrderListUser(
        userId: number,
    ): Promise<AdminGetOrderListUserResponse[]>;

    adminGetOrderUser(orderId: number): Promise<AdminGetOrderUserResponse>;

    adminCreateOrder(dto: OrderDto): Promise<AdminCreateOrderResponse>;

    adminRemoveOrder(orderId: number): Promise<AdminRemoveOrderResponse>;

    userGetOrderList(request: Request): Promise<UserGetOrderListResponse[]>;

    userGetOrder(
        request: Request,
        orderId: number,
    ): Promise<UserGetOrderResponse>;

    userCreateOrder(
        request: Request,
        dto: Omit<OrderDto, 'userId'>,
    ): Promise<UserCreateOrderResponse>;

    guestCreateOrder(
        request: Request,
        dto: OrderDto,
    ): Promise<GuestCreateOrderResponse>;
}
