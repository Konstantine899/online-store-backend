import { ProductModel } from '../../product/product.model';
import { ApiProperty } from '@nestjs/swagger';
import { ITransformData } from '../interfaces/i-transform-data';
import { TransformResponse } from './transform.response';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartResponse implements ITransformData {
  @ApiProperty({ example: 26, description: `Идентификатор корзины` })
  readonly cartId: number;

  @ApiProperty({ type: () => [TransformResponse] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransformResponse)
  readonly products: ProductModel[];
}
