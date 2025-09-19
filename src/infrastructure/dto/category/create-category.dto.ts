import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateCategory } from '@app/domain/dto';

export class CreateCategoryDto implements ICreateCategory {
    @ApiProperty({ example: 'Смартфоны' })
    @IsNotEmpty({ message: 'Поле name не может быть пустым' })
    @IsString({ message: 'Поле name должна быть строкой' })
    declare readonly name: string;

    @ApiProperty({
        type: 'string',
        example: 'fafacc43-51a8-4ce9-9062-8b5e3c12a500.png',
        description: 'Изображение',
    })
    declare readonly image: Express.Multer.File;
}
