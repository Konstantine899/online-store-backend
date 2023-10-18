import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface CreateRole {
    role: string;
    description: string;
}

export class CreateRoleDto implements CreateRole {
    @ApiProperty({
        example: 'USER',
        description: 'Роль пользователя',
    })
    @IsNotEmpty({ message: 'Укажите роль пользователя' })
    @IsString({ message: 'Поле role должно быть строкой' })
    readonly role: string;

    @ApiProperty({
        example: 'Пользователь',
        description: 'Роль пользователя',
    })
    @IsNotEmpty({ message: 'Укажите описание роли пользователя' })
    @IsString({ message: 'Поле описания роли должно быть строкой' })
    readonly description: string;
}
