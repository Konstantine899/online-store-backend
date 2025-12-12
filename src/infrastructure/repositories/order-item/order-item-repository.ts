import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderItemModel } from '@app/domain/models';
import { IOrderItemRepository } from '@app/domain/repositories';

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
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
}
