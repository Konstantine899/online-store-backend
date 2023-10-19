import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { OrderItemModel } from '../order-item/order-item.model';
import { UserModel } from '../user/user.model';

interface Order {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    amount: number;
    status: number;
    comment: string;
    items: OrderItemModel[];
    userId: number;
    user: UserModel;
}

@Table({
    tableName: 'order',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class OrderModel extends Model<OrderModel> implements Order {
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    email: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    phone: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    address: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    amount: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    status: number;

    @Column({ type: DataType.STRING(2200) })
    comment: string;

    @HasMany(() => OrderItemModel, { onDelete: 'CASCADE' })
    items: OrderItemModel[];

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    userId: number;

    @BelongsTo(() => UserModel)
    user: UserModel;
}
