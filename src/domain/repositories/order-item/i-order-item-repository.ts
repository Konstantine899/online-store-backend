import { OrderItemModel } from '../../models/order-item.model';

export interface IOrderItemRepository {
    createItem(order_id: number, item: OrderItemModel): Promise<OrderItemModel>;
}
