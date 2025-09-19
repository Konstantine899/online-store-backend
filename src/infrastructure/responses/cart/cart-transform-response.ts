import { ApiProperty } from '@nestjs/swagger';
import { ICartTransformResponse } from '@app/domain/responses';

export class CartTransformResponse implements ICartTransformResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор продукта',
    })
    declare readonly productId: number;

    @ApiProperty({
        example: 'Xiaomi Redmi Note 10 pro',
        description: 'Имя продукта',
    })
    declare readonly name: string;

    @ApiProperty({
        example: 1000,
        description: 'Цена продукта',
    })
    declare readonly price: number;

    @ApiProperty({
        example: 1,
        description: 'Количество',
    })
    declare readonly quantity: number;
}
