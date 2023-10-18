import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface RemoveRole {
    userId: number;
    role: string;
}

export class RemoveRoleDto implements RemoveRole {
    @ApiProperty({ example: '1', description: 'Идентификатор пользователя' })
    @Transform((value) => Number(value))
    readonly userId: number;

    @ApiProperty({ example: 'ADMIN', description: 'Роль пользователя' })
    @IsNotEmpty({ message: 'Укажите role пользователя' })
    @IsString({ message: 'Поле role должно быть строкой' })
    readonly role: string;
}
