import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderModel, OrderItemModel } from '@app/domain/models';
import { OrderDto } from '@app/infrastructure/dto';
import { OrderItemRepository } from '../order-item/order-item-repository';
import {
    AdminGetStoreOrderListResponse,
    AdminCreateOrderResponse,
    AdminGetOrderUserResponse,
    AdminGetOrderListUserResponse,
    UserGetOrderListResponse,
} from '@app/infrastructure/responses';

import { IOrderRepository } from '@app/domain/repositories';

@Injectable()
export class OrderRepository implements IOrderRepository {
    constructor(
        @InjectModel(OrderModel) private orderModel: typeof OrderModel,
        private readonly orderItemRepository: OrderItemRepository,
    ) {}

    public async adminFindOrderListUser(
        user_id?: number,
    ): Promise<
        AdminGetStoreOrderListResponse[] | AdminGetOrderListUserResponse[]
    > {
        let orders: OrderModel[];
        if (user_id) {
            orders = await this.orderModel.findAll({
                where: { user_id },
                include: [
                    {
                        model: OrderItemModel,
                        as: 'items',
                        attributes: ['name', 'price', 'quantity'],
                    },
                ],
            });
        } else {
            orders = await this.orderModel.findAll({
                include: [
                    {
                        model: OrderItemModel,
                        as: 'items',
                        attributes: ['name', 'price', 'quantity'],
                    },
                ],
            });
        }

        return orders;
    }

    public async adminFindOrderUser(
        id: number,
        user_id?: number,
    ): Promise<AdminGetOrderUserResponse> {
        let order: OrderModel;
        if (user_id) {
            order = await this.orderModel.findOne({
                where: {
                    id,
                    user_id,
                },
                include: [
                    {
                        model: OrderItemModel,
                        as: 'items',
                        attributes: ['name', 'price', 'quantity'],
                    },
                ],
            });
            return order;
        }
        order = await this.orderModel.findByPk(id, {
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        });
        return order;
    }

    public async findUserAndHisOrders(
        user_id: number,
    ): Promise<AdminCreateOrderResponse> {
        return await this.orderModel.findOne({
            where: { user_id },
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        });
    }

    public async adminCreateOrder(
        dto: OrderDto,
    ): Promise<AdminCreateOrderResponse> {
        const { userId } = dto;
        return this.createOrder(dto, userId);
    }

    public async findOrder(orderId: number): Promise<OrderModel> {
        return this.orderModel.findByPk(orderId, {
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        });
    }

    public async removeOrder(id: number): Promise<number> {
        return this.orderModel.destroy({ where: { id } });
    }

    public async userFindOrderList(
        user_id: number,
    ): Promise<UserGetOrderListResponse[]> {
        let orders: OrderModel[];
        if (user_id) {
            orders = await this.orderModel.findAll({
                where: { user_id },
                include: [
                    {
                        model: OrderItemModel,
                        as: 'items',
                        attributes: ['name', 'price', 'quantity'],
                    },
                ],
            });
        } else {
            orders = await this.orderModel.findAll();
        }

        return orders;
    }

    public async userFindOrder(
        order_id: number,
        user_id?: number,
    ): Promise<OrderModel> {
        return this.orderModel.findOne({
            where: {
                user_id,
                id: order_id,
            },
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        });
    }

    public async createOrder(
        dto: Omit<OrderDto, 'userId'>,
        userId: number,
    ): Promise<OrderModel> {
        const order: OrderModel = new OrderModel();
        order.user_id = userId;
        order.name = dto.name;
        order.email = dto.email;
        order.phone = dto.phone;
        order.address = dto.address;
        order.comment = dto.comment;
        order.amount = dto.items.reduce(
            (sum: number, item: OrderItemModel) => sum + item.price,
            0,
        );
        await order.save();
        for (const item of dto.items) {
            await this.orderItemRepository.createItem(order.id, item);
        }

        return this.orderModel.findByPk(order.id, {
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        });
    }
}
