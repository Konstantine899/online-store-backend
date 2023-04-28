import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { ProductModel } from '../product/product.model';
import { CartProductModel } from './cart-product.model';

@Table({
  tableName: 'cart',
  underscored: true,
  defaultScope: {
	attributes: { exclude: [`updatedAt`, `createdAt`] },
  },
})
export class CartModel extends Model<CartModel> {
  @Column({
	type: DataType.INTEGER,
	unique: true,
	primaryKey: true,
	autoIncrement: true,
  })
  id: number;

  @BelongsToMany(() => ProductModel, {
	through: () => CartProductModel,
	onDelete: 'CASCADE',
  })
  products: ProductModel[];
}
