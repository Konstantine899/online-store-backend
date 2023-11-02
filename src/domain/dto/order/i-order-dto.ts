import { OrderItemModel } from '../../models/order-item.model';

export interface IOrderDto {
    userId?: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    comment: string;
    items: OrderItemModel[];
}
