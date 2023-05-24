import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../product/product.model';
import { ITransformData } from '../interfaces/i-transform-data';

export class IncrementResponse implements ITransformData {
  @ApiProperty({ example: 26, description: `Идентификатор корзины` })
  readonly cartId: number;

  @ApiProperty({
	example: [
		{
		productId: 55,
		name: 'Смартфон Xiaomi Redmi Note 13 Pro 4G 8GB/256GB RU (синий)',
		price: 1149,
		quantity: 2,
		},
	],
	description: `Позиции продуктов в корзине`,
  })
  readonly products: ProductModel[];
}
