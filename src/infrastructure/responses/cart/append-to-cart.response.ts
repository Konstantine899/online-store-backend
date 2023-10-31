import { ICartTransformData } from '../../../domain/transform/cart/i-cart-transform-data';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../../domain/models/product.model';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformResponse } from './transform.response';

export class AppendToCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    readonly cartId: number;

    @ApiProperty({ type: () => [TransformResponse] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransformResponse)
    readonly products: ProductModel[];
}
