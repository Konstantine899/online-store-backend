import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateProductPropertyDto } from '@app/domain/dto';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

export class CreateProductPropertyDto implements ICreateProductPropertyDto {
    @ApiProperty({
        example: 'Объем встроенной памяти',
        description: 'Название свойства продукта',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString({ message: 'Название свойства должно быть строкой' })
    @IsNotEmpty({ message: 'Название свойства не должно быть пустым' })
    @MinLength(2, {
        message: 'Название свойства должно содержать минимум 2 символа',
    })
    @MaxLength(100, {
        message: 'Название свойства не может быть длиннее 100 символов',
    })
    @IsSanitizedString({
        message: 'Название свойства содержит недопустимые символы',
    })
    declare readonly name: string;

    @ApiProperty({
        example: '256 ГБ',
        description: 'Значение свойства продукта',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString({ message: 'Значение свойства должно быть строкой' })
    @IsNotEmpty({ message: 'Значение свойства не должно быть пустым' })
    @MinLength(1, {
        message: 'Значение свойства должно содержать минимум 1 символ',
    })
    @MaxLength(200, {
        message: 'Значение свойства не может быть длиннее 200 символов',
    })
    @IsSanitizedString({
        message: 'Значение свойства содержит недопустимые символы',
    })
    declare readonly value: string;
}
