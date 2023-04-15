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

@Table({ tableName: 'order', underscored: true })
export class OrderModel extends Model<OrderModel> {
  @Column({
	type: DataType.INTEGER,
	unique: true,
	primaryKey: true,
	autoIncrement: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  phone: string;

  @Column({ type: DataType.STRING, allowNull: false })
  address: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  amount: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  status: number;

  @Column({ type: DataType.STRING })
  comment: string;

  @HasMany(() => OrderItemModel, { onDelete: 'CASCADE' })
  items: OrderItemModel[];

  @ForeignKey(() => UserModel)
  userId: number;

  @BelongsTo(() => UserModel)
  user: UserModel;
}
