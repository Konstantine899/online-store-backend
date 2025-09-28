import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { OrderModel } from './order.model';
import { ApiProperty } from '@nestjs/swagger';
import { Op } from 'sequelize';

interface IOrderItemModel {
    id: number;
    name: string;
    price: number;
    quantity: number;
    order_id: number;
    order: OrderModel;
    createdAt: Date;
    updatedAt: Date;
}

interface IOrderItemCreationAttributes {
    name: string;
    price: number;
    quantity: number;
    order_id: number;
}

@Table({
    tableName: 'order_item',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        byOrder: (orderId: number) => ({
            where: { order_id: orderId },
        }),
        byPriceRange: (min: number, max: number) => ({
            where: {
                price: {
                    [Op.between]: [min, max],
                },
            },
        }),
        expensive: (threshold: number = 1000) => ({
            where: {
                price: {
                    [Op.gte]: threshold,
                },
            },
        }),
        byQuantity: (quantity: number) => ({
            where: { quantity },
        }),
        withOrder: {
            include: [{
                model: OrderModel,
                attributes: ['id', 'status', 'user_id', 'amount'],
            }],
        },
    },
})
export class OrderItemModel
    extends Model<IOrderItemModel, IOrderItemCreationAttributes>
    implements IOrderItemModel
{
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @ApiProperty({
        example: 'Xiaomi 10pro',
        description: 'Имя продукта',
    })
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name!: string;

    @ApiProperty({
        example: 1000,
        description: 'Цена продукта',
    })
    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    price!: number;

    @ApiProperty({
        example: 1,
        description: 'Количество',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    quantity!: number;

    @ForeignKey(() => OrderModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    order_id!: number;

    @BelongsTo(() => OrderModel)
    order!: OrderModel;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'created_at',
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'updated_at',
    })
    declare updatedAt: Date;
}
