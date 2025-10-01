import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateUserDto } from '@app/domain/dto';
import { IsPasswordStrong } from '@app/infrastructure/common/validators/password-strength.validator';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';

export class CreateUserDto implements ICreateUserDto {
    @ApiProperty({
        example: 'test@mail.com',
        description: 'Электронный адрес пользователя',
    })
    @IsNotEmpty({ message: 'Укажите email' })
    @IsString({ message: 'Поле email должно быть строкой' })
    @IsEmail({}, { message: 'Не верный формат email' })
    @IsSanitizedString({ message: 'Email содержит недопустимые символы' })
    declare readonly email: string;

    @ApiProperty({
        example: 'MySecure123!',
        description:
            'Пароль пользователя (минимум 8 символов, включая заглавные, строчные буквы, цифры и спецсимволы)',
    })
    @IsNotEmpty({ message: 'Поле пароль не должно быть пустым' })
    @IsString({ message: 'Поле пароля должно быть строкой' })
    @IsPasswordStrong({
        message: 'Пароль не соответствует требованиям безопасности',
    })
    declare readonly password: string;

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
