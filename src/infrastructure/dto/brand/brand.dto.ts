import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateBrand } from '@app/domain/dto';

export class BrandDto implements ICreateBrand {
    @ApiProperty({
        example: 'Bosh',
        description: 'Имя бренда',
    })
    @IsNotEmpty({ message: 'Поле name не может быть пустым' })
    @IsString({ message: 'Поле name должно быть строкой' })
    declare readonly name: string;

    @ApiProperty({
        example: 1,
        description: 'category_id',
    })
    @IsNotEmpty({ message: 'Поле category_id не может быть пустым' })
    @IsNumber({}, { message: 'Поле category_id должно быть number ' })
    declare readonly category_id: number;
}
