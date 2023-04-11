import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { OrderModel } from '../order/order.model';

@Table({ tableName: 'order-item', underscored: true })
export class OrderItemModel extends Model<OrderItemModel> {
  @Column({
	type: DataType.INTEGER,
	unique: true,
	primaryKey: true,
	autoIncrement: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  price: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity: number;

  @ForeignKey(() => OrderModel)
  orderId: number;

  @BelongsTo(() => OrderModel)
  order: OrderModel;
}
