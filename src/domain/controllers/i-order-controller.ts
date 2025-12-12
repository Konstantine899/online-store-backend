import type {
    AdminGetStoreOrderListResponse,
    AdminGetOrderListUserResponse,
    AdminGetOrderUserResponse,
    AdminCreateOrderResponse,
    AdminRemoveOrderResponse,
    UserGetOrderResponse,
    UserGetOrderListResponse,
    UserCreateOrderResponse,
    GuestCreateOrderResponse,
} from '@app/infrastructure/responses';
import type { OrderDto } from '@app/infrastructure/dto';
import type { Request } from 'express';

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
