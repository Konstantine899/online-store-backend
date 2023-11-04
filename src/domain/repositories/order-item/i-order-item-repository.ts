import { OrderItemModel } from '@app/domain/models';

export interface IOrderItemRepository {
    createItem(order_id: number, item: OrderItemModel): Promise<OrderItemModel>;
}
