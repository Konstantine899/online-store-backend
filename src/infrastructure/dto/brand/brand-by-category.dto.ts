import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class BrandByCategoryDto {
    @ApiProperty({
        example: 1,
        description: 'category_id',
    })
    @IsNotEmpty({ message: 'Поле category_id не может быть пустым' })
    @IsNumber({}, { message: 'Поле category_id должно быть number ' })
    readonly category_id: number;
}
