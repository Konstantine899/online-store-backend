import { Op } from 'sequelize';
import {
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { OrderItemModel } from './order-item.model';
import { UserModel } from './user.model';

interface IOrderModel {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    amount: number;
    status: number;
    comment: string;
    items: OrderItemModel[];
    user_id: number;
    user: UserModel;
    tenant_id?: number;
    createdAt: Date;
    updatedAt: Date;
}

interface IOrderCreationAttributes {
    name: string;
    email: string;
    phone: string;
    address: string;
    amount: number;
    status?: number;
    comment?: string;
    user_id: number;
    tenant_id?: number;
}

@Table({
    tableName: 'order',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        // Scope для фильтрации по статусу
        byStatus: (status: number) => ({
            where: { status },
        }),
        // Scope для заказов пользователя
        byUser: (userId: number) => ({
            where: { user_id: userId },
        }),
        // Scope для недавних заказов
        recent: (days: number = 30) => ({
            where: {
                created_at: {
                    [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
            },
        }),
        // Scope для заказов с элементами
        withItems: {
            include: [
                {
                    model: OrderItemModel,
                    attributes: ['id', 'name', 'price', 'quantity'],
                },
            ],
        },
        // Scope для заказов с пользователем
        withUser: {
            include: [
                {
                    model: UserModel,
                    attributes: ['id', 'email', 'name'],
                },
            ],
        },
        // Scope для аналитики по сумме
        byAmountRange: (min: number, max: number) => ({
            where: {
                amount: {
                    [Op.between]: [min, max],
                },
            },
        }),
    },
})
export class OrderModel
    extends Model<OrderModel, IOrderCreationAttributes>
    implements IOrderModel
{
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    phone!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    address!: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    amount!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    status!: number;

    @Column({ type: DataType.STRING(2200), allowNull: true })
    comment!: string;

    @HasMany(() => OrderItemModel, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    items!: OrderItemModel[];

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    user_id!: number;

    @BelongsTo(() => UserModel)
    user!: UserModel;

    @Column({ type: DataType.INTEGER, allowNull: true, field: 'tenant_id' })
    tenant_id?: number;

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
