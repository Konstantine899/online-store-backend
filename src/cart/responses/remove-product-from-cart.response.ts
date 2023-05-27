import { ITransformData } from '../interfaces/i-transform-data';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../product/product.model';

export class RemoveProductFromCartResponse implements ITransformData {
  @ApiProperty({ example: 26, description: `Идентификатор корзины` })
  readonly cartId: number;

  @ApiProperty({
	example: [],
	description: `Удаление одной позиции из корзины`,
  })
  readonly products: ProductModel[];
}
