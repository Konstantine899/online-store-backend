import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '@app/domain/models';
import { ICartTransformData } from '@app/domain/transform';
import { CartTransformResponse } from './cart-transform-response';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class IncrementResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    declare readonly cartId: number;

    @ApiProperty({ type: () => [CartTransformResponse] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartTransformResponse)
    declare readonly products: ProductModel[];
}
