import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';

export class UpdateUserProfileDto {
    @ApiPropertyOptional({
        example: 'Иван',
        description: 'Имя пользователя',
    })
    @IsOptional()
    @IsString({ message: 'Поле имени должно быть строкой' })
    @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
    @MaxLength(100, { message: 'Имя не может быть длиннее 100 символов' })
    @IsSanitizedString({ message: 'Имя содержит недопустимые символы' })
    declare readonly firstName?: string;

    @ApiPropertyOptional({
        example: 'Иванов',
        description: 'Фамилия пользователя',
    })
    @IsOptional()
    @IsString({ message: 'Поле фамилии должно быть строкой' })
    @MinLength(2, { message: 'Фамилия должна содержать минимум 2 символа' })
    @MaxLength(100, {
        message: 'Фамилия не может быть длиннее 100 символов',
    })
    @IsSanitizedString({ message: 'Фамилия содержит недопустимые символы' })
    declare readonly lastName?: string;
}
