import { ProductModel, ProductPropertyModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductResponse extends ProductModel {
    @ApiProperty({
        example: 54,
        description: 'Идентификатор продукта',
    })
    id: number;

    @ApiProperty({
        example: 'Смартфон Xiaomi Redmi Note 12 Pro 4G 8GB/256GB RU (синий)',
        description: 'Имя продукта',
    })
    name: string;

    @ApiProperty({
        example: 1000,
        description: 'Цена продукта',
    })
    price: number;

    @ApiProperty({
        example: 5,
        description: 'Рейтинг продукта',
    })
    rating: number;

    @ApiProperty({
        example: '926429b8-69bf-439b-b9be-6f4893d7bab9.jpg',
        description: 'Имя и расширение изображения продукта',
    })
    image: string;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор категории',
    })
    category_id: number;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор бренда',
    })
    brand_id: number;

    @ApiProperty({ type: () => [ProductPropertyModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductPropertyModel)
    properties: ProductPropertyModel[];
}
