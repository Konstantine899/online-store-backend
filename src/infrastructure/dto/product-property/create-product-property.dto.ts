import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateProductPropertyDto } from '@app/domain/dto';

export class CreateProductPropertyDto implements ICreateProductPropertyDto {
    @ApiProperty({
        example: 'Объем встроенной памяти',
        description: 'Имя свойства продукта',
    })
    @IsNotEmpty({ message: 'Имя свойства не должно быть пустым' })
    @IsString({ message: 'Имя свойства  должно быть строкой' })
    declare readonly name: string;

    @ApiProperty({
        example: '256 ГБ',
        description: 'Значение свойства продукта',
    })
    @IsNotEmpty({ message: 'Значение свойства не должно быть пустым' })
    @IsString({ message: 'Значение свойства  должно быть строкой' })
    declare readonly value: string;
}
