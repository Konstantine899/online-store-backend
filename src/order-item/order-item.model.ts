import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { OrderModel } from '../order/order.model';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'order-item',
  underscored: true,
  defaultScope: {
	attributes: { exclude: [`updatedAt`, `createdAt`] },
  },
})
export class OrderItemModel extends Model<OrderItemModel> {
  @Column({
	type: DataType.INTEGER,
	unique: true,
	primaryKey: true,
	autoIncrement: true,
  })
  id: number;

  @ApiProperty({ example: `Xiaomi 10pro`, description: `Имя продукта` })
  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @ApiProperty({ example: 1000, description: `Цена продукта` })
  @Column({ type: DataType.FLOAT, allowNull: false })
  price: number;

  @ApiProperty({ example: 1, description: `Количество` })
  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity: number;

  @ForeignKey(() => OrderModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  orderId: number;

  @BelongsTo(() => OrderModel)
  order: OrderModel;
}
