import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';
import { ProductModel } from '../product/product.model';

interface ICreateBrandAttributes {
  name: string;
}

@Injectable()
@Table({ tableName: 'brand' })
export class BrandModel extends Model<BrandModel, ICreateBrandAttributes> {
  @Column({
	type: DataType.INTEGER,
	unique: true,
	primaryKey: true,
	autoIncrement: true,
  })
  id: number;

  @Column({
	type: DataType.STRING,
	unique: true,
	allowNull: false,
  })
  name: string;

  @HasMany(() => ProductModel, { onDelete: 'RESTRICT' })
  products: ProductModel[];
}
