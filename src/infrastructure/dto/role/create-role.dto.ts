import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateRoleDto } from '@app/domain/dto';

export class CreateRoleDto implements ICreateRoleDto {
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
