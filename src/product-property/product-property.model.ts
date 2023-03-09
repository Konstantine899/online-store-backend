import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';
import { ProductModel } from '../product/product.model';

@Injectable()
@Table({ tableName: 'product-property' })
export class ProductPropertyModel extends Model<ProductPropertyModel> {
  @Column({
	type: DataType.INTEGER,
	primaryKey: true,
	autoIncrement: true,
	allowNull: false,
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
  value: string;

  @ForeignKey(() => ProductModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: number;

  @BelongsTo(() => ProductModel)
  product: ProductModel;
}
