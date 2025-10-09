import {
    IsNotEmpty,
    IsString,
    IsInt,
    IsPositive,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IRemoveRoleDto } from '@app/domain/dto';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

export class RemoveRoleDto implements IRemoveRoleDto {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    @Type(() => Number)
    @IsInt({ message: 'Идентификатор пользователя должен быть целым числом' })
    @IsPositive({
        message: 'Идентификатор пользователя должен быть положительным',
    })
    declare readonly userId: number;

    @ApiProperty({
        example: 'ADMIN',
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
}
