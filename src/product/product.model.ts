import { Injectable } from '@nestjs/common';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { CategoryModel } from '../category/category-model';
import { BrandModel } from '../brand/brand.model';

interface IUserCreationAttributes {
  name: string;
  price: number;
  image: string;
}

@Injectable()
@Table({ tableName: 'product' })
export class ProductModel extends Model<ProductModel, IUserCreationAttributes> {
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

  @Column({ type: DataType.FLOAT, allowNull: false })
  price: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  rating: number;

  @Column({ type: DataType.STRING, allowNull: false })
  image: string;

  @ForeignKey(() => CategoryModel)
  @Column({ type: DataType.INTEGER })
  categoryId: number;

  @BelongsTo(() => CategoryModel)
  category: CategoryModel;

  @ForeignKey(() => BrandModel)
  @Column({ type: DataType.INTEGER })
  brandId: number;

  @BelongsTo(() => BrandModel)
  brand: BrandModel;
}
