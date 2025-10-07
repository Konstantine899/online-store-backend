import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateRoleDto } from '@app/domain/dto';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

export class CreateRoleDto implements ICreateRoleDto {
    @ApiProperty({
        example: 'USER',
        description: 'Название роли',
    })
    @IsNotEmpty({ message: 'Укажите название роли' })
    @IsString({ message: 'Название роли должно быть строкой' })
    @MaxLength(50, {
        message: 'Название роли не может быть длиннее 50 символов',
    })
    @IsSanitizedString({
        message: 'Название роли содержит недопустимые символы',
    })
    declare readonly role: string;

    @ApiProperty({
        example: 'Пользователь',
        description: 'Описание роли',
    })
    @IsNotEmpty({ message: 'Укажите описание роли' })
    @IsString({ message: 'Описание роли должно быть строкой' })
    @MaxLength(200, {
        message: 'Описание роли не может быть длиннее 200 символов',
    })
    @IsSanitizedString({
        message: 'Описание роли содержит недопустимые символы',
    })
    declare readonly description: string;
}