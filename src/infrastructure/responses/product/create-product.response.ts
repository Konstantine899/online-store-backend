import { ProductModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductResponse extends ProductModel {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор продукта',
    })
    declare id: number;

    @ApiProperty({
        example: 5,
        description: 'Рейтинг продукта',
    })
    declare rating: number;

    @ApiProperty({
        example: 'Xiaomi Redmi 10 pro',
        description: 'Имя продукта',
    })
    declare name: string;

    @ApiProperty({
        example: 1000,
        description: 'Цена продукта',
    })
    declare price: number;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор бренда',
    })
    declare brand_id: number;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор категории',
    })
    declare category_id: number;

    @ApiProperty({
        example: '471d35be-9906-4cee-a681-76a53a19bd25.png',
        description: 'Имя и расширение картинки',
    })
    declare image: string;

    @ApiProperty({
        example: '2023-05-04T17:50:12.370Z',
        description: 'Время обновления',
    })
    declare updatedAt?: string;

    @ApiProperty({
        example: '2023-05-04T17:50:12.370Z',
        description: 'Время создания',
    })
    declare createdAt?: string;
}
