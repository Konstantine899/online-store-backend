import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderItemModel } from '../../../domain/models/order-item.model';
import { IOrderItemRepository } from '../../../domain/repositories/order-item/i-order-item-repository';

@Injectable()
export class OrderItemRepository implements IOrderItemRepository {
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