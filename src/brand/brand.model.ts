import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';

interface CreateBrandAttributes {
  name: string;
}

@Injectable()
@Table({ tableName: 'brand' })
export class BrandModel extends Model<BrandModel, CreateBrandAttributes> {
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
