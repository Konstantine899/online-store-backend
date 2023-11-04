import { ProductModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';
import { ICartTransformData } from '@app/domain/transform';
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
