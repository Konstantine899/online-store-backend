import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { CartModel } from './cart.model';
import { ProductModel } from '../product/product.model';

@Table({ tableName: 'cart-product', underscored: true })
export class CartProductModel extends Model<CartProductModel> {
  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  quantity: number;

  @ForeignKey(() => CartModel)
  @Column({ type: DataType.INTEGER })
  cartId: number;

  @ForeignKey(() => ProductModel)
  @Column({ type: DataType.INTEGER })
  productId: number;
}
