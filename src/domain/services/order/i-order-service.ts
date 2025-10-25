import type {
    AdminGetStoreOrderListResponse,
    AdminCreateOrderResponse,
    AdminGetOrderUserResponse,
    AdminGetOrderListUserResponse,
    AdminRemoveOrderResponse,
    UserGetOrderResponse,
    UserGetOrderListResponse,
    UserCreateOrderResponse,
    GuestCreateOrderResponse,
} from '@app/infrastructure/responses';
import type { OrderDto } from '@app/infrastructure/dto';

export interface IOrderService {
    adminGetStoreOrderList(): Promise<AdminGetStoreOrderListResponse[]>;

    adminGetOrderListUser(
        userId: number,
    ): Promise<AdminGetOrderListUserResponse[]>;

    adminGetOrderUser(orderId: number): Promise<AdminGetOrderUserResponse>;

    adminCreateOrder(dto: OrderDto): Promise<AdminCreateOrderResponse>;

    adminRemoveOrder(orderId: number): Promise<AdminRemoveOrderResponse>;

    userGetOrderList(userId: number): Promise<UserGetOrderListResponse[]>;

    userGetOrder(
        orderId: number,
        userId: number,
    ): Promise<UserGetOrderResponse>;

    userCreateOrder(
        dto: Omit<OrderDto, 'userId'>,
        userId: number,
        cartId: number,
    ): Promise<UserCreateOrderResponse>;

    guestCreateOrder(
        dto: OrderDto,
        userId?: number,
        cartId?: number,
    ): Promise<GuestCreateOrderResponse>;
}
