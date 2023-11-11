import { ProductModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class ProductInfo extends ProductModel {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор продукта',
    })
    id: number;

    @ApiProperty({
        example: 'Xiaomi Redmi 10 pro',
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
        example: '471d35be-9906-4cee-a681-76a53a19bd25.png',
        description: 'Имя и расширение картинки',
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
}
