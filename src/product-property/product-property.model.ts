import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ProductModel } from '../product/product.model';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'product-property',
  underscored: true,
  defaultScope: {
	attributes: { exclude: [`updatedAt`, `createdAt`] },
  },
})
export class ProductPropertyModel extends Model<ProductPropertyModel> {
  @ApiProperty({ example: 1, description: `Идентификатор свойство продукта` })
  @Column({
	type: DataType.INTEGER,
	primaryKey: true,
	autoIncrement: true,
	allowNull: false,
  })
  id: number;

  @ApiProperty({ example: `Экран:`, description: `Имя свойства` })
  @Column({
	type: DataType.STRING,
	allowNull: false,
  })
  name: string;

  @ApiProperty({
	example: `6.67  1080x2400 пикселей, AMOLED`,
	description: `Значение свойства`,
  })
  @Column({
	type: DataType.STRING,
	allowNull: false,
  })
  value: string;

  @ApiProperty({
	example: 1,
	description: `Идентификатор продукта`,
  })
  @ForeignKey(() => ProductModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: number;

  @BelongsTo(() => ProductModel)
  product: ProductModel;
}
