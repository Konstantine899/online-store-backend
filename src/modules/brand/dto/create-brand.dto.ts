import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface ICreateBrand {
    name: string;
}

export class CreateBrandDto implements ICreateBrand {
    @ApiProperty({
        example: 'Bosh',
        description: 'Имя бренда',
    })
    @IsNotEmpty({ message: 'Поле name не может быть пустым' })
    @IsString({ message: 'Поле name должно быть строкой' })
    readonly name: string;
}
