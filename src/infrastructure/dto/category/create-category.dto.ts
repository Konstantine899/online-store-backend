import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateCategory } from '@app/domain/dto';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

export class CreateCategoryDto implements ICreateCategory {
    @ApiProperty({
        example: 'Смартфоны',
        description: 'Название категории',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString({ message: 'Название категории должно быть строкой' })
    @IsNotEmpty({ message: 'Название категории не может быть пустым' })
    @MinLength(2, {
        message: 'Название категории должно содержать минимум 2 символа',
    })
    @MaxLength(100, {
        message: 'Название категории не может быть длиннее 100 символов',
    })
    @IsSanitizedString({
        message: 'Название категории содержит недопустимые символы',
    })
    declare readonly name: string;

    @ApiProperty({
        type: 'string',
        example: 'fafacc43-51a8-4ce9-9062-8b5e3c12a500.png',
        description: 'Изображение категории',
    })
    declare readonly image: Express.Multer.File;
}
