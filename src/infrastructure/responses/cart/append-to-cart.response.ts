import { ICartTransformData } from '@app/domain/transform';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '@app/domain/models';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CartTransformResponse } from './cart-transform-response';

export class AppendToCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    readonly cartId: number;

    @ApiProperty({ type: () => [CartTransformResponse] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartTransformResponse)
    readonly products: ProductModel[];
}
