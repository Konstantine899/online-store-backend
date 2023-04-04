import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { ProductModel } from '../product/product.model';
import { BasketProductModel } from './basket-product.model';

@Table({ tableName: 'basket', underscored: true })
export class BasketModel extends Model<BasketModel> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @BelongsToMany(() => ProductModel, () => BasketProductModel)
  products: ProductModel[];
}
