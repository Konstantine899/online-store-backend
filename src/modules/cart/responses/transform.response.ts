import { ApiProperty } from '@nestjs/swagger';

interface ITransformResponse {
    productId: number;
    name: string;
    price: number;
    quantity: number;
}

export class TransformResponse implements ITransformResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор продукта',
    })
    productId: number;

    @ApiProperty({
        example: 'Xiaomi Redmi Note 10 pro',
        description: 'Имя продукта',
    })
    name: string;

    @ApiProperty({
        example: 1000,
        description: 'Цена продукта',
    })
    price: number;

    @ApiProperty({
        example: 1,
        description: 'Количество',
    })
    quantity: number;
}
