import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';

interface ICategoryCreationAttributes {
  name: string;
}

@Injectable()
@Table({ tableName: 'category' })
export class CategoryModel extends Model<
  CategoryModel,
  ICategoryCreationAttributes
> {
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
}
