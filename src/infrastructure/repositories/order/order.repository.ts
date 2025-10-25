import { OrderItemModel, OrderModel, ProductModel } from '@app/domain/models';
import { IOrderRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { OrderDto } from '@app/infrastructure/dto';
import {
    AdminCreateOrderResponse,
    AdminGetOrderListUserResponse,
    AdminGetOrderUserResponse,
    AdminGetStoreOrderListResponse,
    UserGetOrderListResponse,
} from '@app/infrastructure/responses';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OrderItemRepository } from '../order-item/order-item-repository';

/**
 * TEST-032: Extended interface for order items with productId
 * Needed for inventory checking and stock management
 */
interface OrderItemWithProduct extends OrderItemModel {
    productId: number;
}

@Injectable()
export class OrderRepository implements IOrderRepository {
    constructor(
        @InjectModel(OrderModel) private orderModel: typeof OrderModel,
        @InjectModel(ProductModel) private productModel: typeof ProductModel,
        private readonly orderItemRepository: OrderItemRepository,
        private readonly sequelize: Sequelize,
        private readonly tenantContext: TenantContext,
    ) {}

    public async adminFindOrderListUser(
        user_id?: number,
    ): Promise<
        AdminGetStoreOrderListResponse[] | AdminGetOrderListUserResponse[]
    > {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        let orders: OrderModel[];
        if (user_id) {
            orders = await this.orderModel.findAll({
                where: { user_id, tenant_id: tenantId },
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
                where: { tenant_id: tenantId },
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
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        let order: OrderModel;
        if (user_id) {
            order = (await this.orderModel.findOne({
                where: {
                    id,
                    user_id,
                    tenant_id: tenantId,
                },
                include: [
                    {
                        model: OrderItemModel,
                        as: 'items',
                        attributes: ['name', 'price', 'quantity'],
                    },
                ],
            })) as AdminGetOrderUserResponse;
            return order;
        }
        order = (await this.orderModel.findOne({
            where: { id, tenant_id: tenantId },
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        })) as AdminGetOrderUserResponse;
        return order;
    }

    public async findUserAndHisOrders(
        user_id: number,
    ): Promise<AdminCreateOrderResponse> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        return (await this.orderModel.findOne({
            where: { user_id, tenant_id: tenantId },
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        })) as AdminCreateOrderResponse;
    }

    public async adminCreateOrder(
        dto: OrderDto,
    ): Promise<AdminCreateOrderResponse> {
        const { userId } = dto;
        if (userId === undefined) {
            throw new Error('userId обязательно для создания заказа');
        }
        return this.createOrder(dto, userId);
    }

    public async findOrder(orderId: number): Promise<OrderModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        return this.orderModel.findOne({
            where: { id: orderId, tenant_id: tenantId },
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        }) as Promise<OrderModel>;
    }

    public async removeOrder(id: number): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        return this.orderModel.destroy({ where: { id, tenant_id: tenantId } });
    }

    public async userFindOrderList(
        user_id: number,
    ): Promise<UserGetOrderListResponse[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        let orders: OrderModel[];
        if (user_id) {
            orders = await this.orderModel.findAll({
                where: { user_id, tenant_id: tenantId },
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
                where: { tenant_id: tenantId },
            });
        }

        return orders;
    }

    public async userFindOrder(
        order_id: number,
        user_id?: number,
    ): Promise<OrderModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        return this.orderModel.findOne({
            where: {
                user_id,
                id: order_id,
                tenant_id: tenantId,
            },
            include: [
                {
                    model: OrderItemModel,
                    as: 'items',
                    attributes: ['name', 'price', 'quantity'],
                },
            ],
        }) as Promise<OrderModel>;
    }

    public async createOrder(
        dto: Omit<OrderDto, 'userId'>,
        userId: number,
    ): Promise<OrderModel> {
        // TEST-032: Inventory checking + transaction + pessimistic locking
        return this.sequelize.transaction(
            {
                isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
            },
            async (transaction: Transaction) => {
                // Cast items to include productId (TEST-032 requirement)
                const itemsWithProduct =
                    dto.items as unknown as OrderItemWithProduct[];

                // 1. Extract product IDs from order items
                const productIds = itemsWithProduct.map(
                    (item) => item.productId,
                );

                // 2. Lock products FOR UPDATE (pessimistic locking)
                const products = await this.productModel.findAll({
                    where: {
                        id: {
                            [Op.in]: productIds,
                        },
                    },
                    lock: Transaction.LOCK.UPDATE,
                    transaction,
                });

                // 3. Check stock availability for each item
                for (const item of itemsWithProduct) {
                    const product = products.find(
                        (p) => p.id === item.productId,
                    );

                    if (!product) {
                        throw new ConflictException(
                            `Товар с ID ${item.productId} не найден`,
                        );
                    }

                    const requestedQuantity = item.quantity || 1;

                    if (product.stock < requestedQuantity) {
                        throw new ConflictException(
                            `Недостаточно товара на складе: ${product.name}. ` +
                                `Доступно: ${product.stock}, запрошено: ${requestedQuantity}`,
                        );
                    }
                }

                // 4. Decrement stock atomically
                for (const item of itemsWithProduct) {
                    const requestedQuantity = item.quantity || 1;

                    await this.productModel.decrement('stock', {
                        by: requestedQuantity,
                        where: {
                            id: item.productId,
                        },
                        transaction,
                    });
                }

                // 5. Create order
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
                order.tenant_id = this.tenantContext.getTenantIdOrNull() ?? 1;
                await order.save({ transaction });

                // 6. Create order items
                for (const item of dto.items) {
                    await this.orderItemRepository.createItem(order.id, item);
                }

                // 7. Return created order with items
                const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
                return this.orderModel.findOne({
                    where: { id: order.id, tenant_id: tenantId },
                    include: [
                        {
                            model: OrderItemModel,
                            as: 'items',
                            attributes: ['name', 'price', 'quantity'],
                        },
                    ],
                    transaction,
                }) as Promise<OrderModel>;
            },
        );
    }
}
