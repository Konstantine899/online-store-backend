import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateBrand } from '@app/domain/dto';

export class CreateBrandDto implements ICreateBrand {
    @ApiProperty({
        example: 'Bosh',
        description: 'Имя бренда',
    })
    @IsNotEmpty({ message: 'Поле name не может быть пустым' })
    @IsString({ message: 'Поле name должно быть строкой' })
    readonly name: string;
}
