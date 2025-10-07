import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateBrand } from '@app/domain/dto';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

export class BrandDto implements ICreateBrand {
    @ApiProperty({
        example: 'Bosh',
        description: 'Название бренда',
    })
    @IsNotEmpty({ message: 'Название бренда не может быть пустым' })
    @IsString({ message: 'Название бренда должно быть строкой' })
    @MaxLength(100, {
        message: 'Название бренда не может быть длиннее 100 символов',
    })
    @IsSanitizedString({
        message: 'Название бренда содержит недопустимые символы',
    })
    declare readonly name: string;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор категории',
    })
    @IsNotEmpty({ message: 'Идентификатор категории не может быть пустым' })
    @IsNumber({}, { message: 'Идентификатор категории должен быть числом' })
    declare readonly category_id: number;
}