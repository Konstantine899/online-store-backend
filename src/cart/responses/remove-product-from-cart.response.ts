import { ITransformData } from '../interfaces/i-transform-data';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../product/product.model';

export class RemoveProductFromCartResponse implements ITransformData {
  @ApiProperty({ example: 26 })
  readonly cartId: number;

  @ApiProperty({
	example: [],
  })
  readonly products: ProductModel[];
}
