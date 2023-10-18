import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export interface AddRole {
    userId: number;
    role: string;
}

export class AddRoleDto implements AddRole {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    @Transform((value) => Number(value))
    readonly userId: number;

    @ApiProperty({
        example: 'ADMIN',
        description: 'Роль пользователя',
    })
    @IsNotEmpty({ message: 'Укажите role пользователя' })
    @IsString({ message: 'Поле role должно быть строкой' })
    readonly role: string;
}
