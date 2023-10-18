import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface CreateBrand {
    name: string;
}

export class CreateBrandDto implements CreateBrand {
    @ApiProperty({
        example: 'Bosh',
        description: 'Имя бренда',
    })
    @IsNotEmpty({ message: 'Поле name не может быть пустым' })
    @IsString({ message: 'Поле name должно быть строкой' })
    readonly name: string;
}
