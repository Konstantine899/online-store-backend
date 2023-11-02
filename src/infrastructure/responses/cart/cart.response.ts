import { ProductModel } from '../../../domain/models/product.model';
import { ApiProperty } from '@nestjs/swagger';
import { ICartTransformData } from '../../../domain/transform/cart/i-cart-transform-data';
import { CartTransformResponse } from './cart-transform-response';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    readonly cartId: number;

    @ApiProperty({ type: () => [CartTransformResponse] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartTransformResponse)
    readonly products: ProductModel[];
}
