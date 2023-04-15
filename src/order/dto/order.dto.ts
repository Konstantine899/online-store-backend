import { OrderItemModel } from '../../order-item/order-item.model';

export class OrderDto {
  readonly userId: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly comment: string;
  readonly items: OrderItemModel[];
}
