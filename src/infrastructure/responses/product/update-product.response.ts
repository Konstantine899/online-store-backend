import { ProductModel } from '../../../domain/models/product.model';
import { ApiProperty } from '@nestjs/swagger';
import { ProductPropertyModel } from '../../../domain/models/product-property.model';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductResponse extends ProductModel {
    @ApiProperty({ example: 5, description: 'Рейтинг продукта' })
    rating: number;

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    id: number;

    @ApiProperty({
        example: 'Xiaomi Redmi 10 pro',
        description: 'Имя продукта',
    })
    name: string;

    @ApiProperty({ example: 1000, description: 'Цена продукта' })
    price: number;

    @ApiProperty({ example: 1, description: 'Идентификатор бренда' })
    brand_id: number;

    @ApiProperty({ example: 1, description: 'Идентификатор категории' })
    category_id: number;

    @ApiProperty({ type: () => [ProductPropertyModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductPropertyModel)
    properties: ProductPropertyModel[];

    @ApiProperty({
        example: '471d35be-9906-4cee-a681-76a53a19bd25.png',
        description: 'Имя и расширение картинки',
    })
    image: string;

    @ApiProperty({
        example: '2023-05-04T17:50:12.370Z',
        description: 'Время обновления',
    })
    updatedAt?: string;
}
