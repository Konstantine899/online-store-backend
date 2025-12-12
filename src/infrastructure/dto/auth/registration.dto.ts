import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TRegistration } from '@app/domain/dto';
import { IsPasswordStrong } from '@app/infrastructure/common/validators/password-strength.validator';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';

export class RegistrationDto implements TRegistration {
    @ApiProperty({
        example: 'test@mail.com',
        description: 'Адрес электронной почты',
    })
    @IsNotEmpty({ message: 'Поле email не должно быть пустым' })
    @IsString({ message: 'Поле email должно быть строкой' })
    @IsEmail({}, { message: 'Не верный формат email' })
    @IsSanitizedString({ message: 'Email содержит недопустимые символы' })
    declare readonly email: string;

    @ApiProperty({
        example: 'MySecure123!',
        description:
            'Пароль (минимум 8 символов, включая заглавные, строчные буквы, цифры и спецсимволы)',
    })
    @IsNotEmpty({ message: 'Поле пароль не должно быть пустым' })
    @IsString({ message: 'Поле пароля должно быть строкой' })
    @IsPasswordStrong({
        message: 'Пароль не соответствует требованиям безопасности',
    })
    declare readonly password: string;
}
