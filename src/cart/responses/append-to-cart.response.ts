import { ITransformData } from '../interfaces/i-transform-data';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../product/product.model';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformResponse } from './transform.response';

export class AppendToCartResponse implements ITransformData {
  @ApiProperty({ example: 26, description: `Идентификатор корзины` })
  readonly cartId: number;

  @ApiProperty({ type: () => [TransformResponse] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransformResponse)
  readonly products: ProductModel[];
}
