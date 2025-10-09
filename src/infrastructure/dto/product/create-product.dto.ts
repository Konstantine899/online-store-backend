import {
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
    MaxLength,
    MinLength,
    Min,
    IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateProductDto } from '@app/domain/dto';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

export class CreateProductDto implements ICreateProductDto {
    @ApiProperty({
        example: 'Xiaomi Redmi 10 pro',
        description: 'Название продукта',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString({ message: 'Название продукта должно быть строкой' })
    @IsNotEmpty({ message: 'Название продукта не должно быть пустым' })
    @MinLength(3, {
        message: 'Название продукта должно содержать минимум 3 символа',
    })
    @MaxLength(255, {
        message: 'Название продукта не может быть длиннее 255 символов',
    })
    @IsSanitizedString({
        message: 'Название продукта содержит недопустимые символы',
    })
    declare readonly name: string;

    @ApiProperty({ example: 2000, description: 'Цена продукта' })
    @Type(() => Number)
    @IsNumber(
        { allowNaN: false, maxDecimalPlaces: 2 },
        {
            message:
                'Цена продукта должна быть числом c двумя знаками после точки',
        },
    )
    @IsPositive({ message: 'Цена продукта должна быть положительным числом' })
    @Min(0.01, { message: 'Минимальная цена продукта 0.01' })
    declare readonly price: number;

    @ApiProperty({
        type: 'string',
        example: 'fafacc43-51a8-4ce9-9062-8b5e3c12a500.png',
        description: 'Изображение продукта',
    })
    declare readonly image: Express.Multer.File;

    @ApiProperty({ example: 1, description: 'Идентификатор бренда продукта' })
    @Type(() => Number)
    @IsInt({ message: 'Идентификатор бренда должен быть целым числом' })
    @IsPositive({ message: 'Идентификатор бренда должен быть положительным' })
    declare readonly brandId: number;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор категории продукта',
    })
    @Type(() => Number)
    @IsInt({ message: 'Идентификатор категории должен быть целым числом' })
    @IsPositive({
        message: 'Идентификатор категории должен быть положительным',
    })
    declare readonly categoryId: number;
}
