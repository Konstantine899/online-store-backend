import { ITransformData } from '../interfaces/i-transform-data';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../product/product.model';

export class DecrementResponse implements ITransformData {
  @ApiProperty({ example: 26 })
  readonly cartId: number;

  @ApiProperty({
	example: [
		{
		productId: 55,
		name: 'Смартфон Xiaomi Redmi Note 13 Pro 4G 8GB/256GB RU (синий)',
		price: 1149,
		quantity: 1,
		},
	],
  })
  readonly products: ProductModel[];
}
