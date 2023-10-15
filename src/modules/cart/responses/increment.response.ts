import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../product/product.model';
import { ITransformData } from '../interfaces/i-transform-data';
import { TransformResponse } from './transform.response';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class IncrementResponse implements ITransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    readonly cartId: number;

    @ApiProperty({ type: () => [TransformResponse] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransformResponse)
    readonly products: ProductModel[];
}
