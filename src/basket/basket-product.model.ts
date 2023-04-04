import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { BasketModel } from './basket.model';
import { ProductModel } from '../product/product.model';

@Table({ tableName: 'basket_product', underscored: true })
export class BasketProductModel extends Model<BasketModel> {
  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  quantity: number;

  @ForeignKey(() => BasketModel)
  @Column({ type: DataType.INTEGER })
  basketId: number;

  @ForeignKey(() => ProductModel)
  @Column({ type: DataType.INTEGER })
  productId: number;
}
