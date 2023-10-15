import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({
        example: 'Xiaomi Redmi 10 pro',
        description: 'Название продукта',
    })
    @IsNotEmpty({ message: 'Имя не должно быть пустым' })
    @IsString({ message: 'Имя  должно быть строкой' })
    readonly name: string;

    @ApiProperty({ example: 2000, description: 'Цена продукта' })
    @IsNumber(
        { allowNaN: false, maxDecimalPlaces: 2 },
        {
            message:
                'Цена продукта должна быть числом c двумя знаками после точки',
        },
    )
    @Transform(({ value }): number => Number.parseFloat(value))
    readonly price: number;

    @ApiProperty({
        type: 'file',
        example: 'fafacc43-51a8-4ce9-9062-8b5e3c12a500.png',
        description: 'Изображение',
        properties: { image: { type: 'string', format: 'binary' } },
    })
    readonly image: Express.Multer.File;

    @ApiProperty({ example: 1, description: 'Идентификатор бренда продукта' })
    @Transform(({ value }): number => Number.parseFloat(value))
    readonly brandId: number;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор категории продукта',
    })
    @Transform(({ value }): number => Number.parseFloat(value))
    readonly categoryId: number;
}
