import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderItemModel } from './order-item.model';

@Injectable()
export class OrderItemRepository {
    constructor(
        @InjectModel(OrderItemModel)
        private orderItemModel: typeof OrderItemModel,
    ) {}

    public async createItem(
        order_id: number,
        item: OrderItemModel,
    ): Promise<OrderItemModel> {
        return this.orderItemModel.create({
            order_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        });
    }
}
