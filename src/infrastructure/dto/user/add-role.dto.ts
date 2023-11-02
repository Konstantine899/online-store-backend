import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IAddRoleDto } from '../../../domain/dto/user/i-add-role-dto';

export class AddRoleDto implements IAddRoleDto {
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
