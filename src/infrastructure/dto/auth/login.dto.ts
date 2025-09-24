import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TLogin } from '@app/domain/dto';
import { IsPasswordStrong, IsSanitizedString } from '@app/infrastructure/common/validators';

export class LoginDto implements TLogin {
    @ApiProperty({
        example: 'test@mail.com',
        description: 'Адрес электронной почты',
    })
    @IsNotEmpty({ message: 'Укажите email' })
    @IsString({ message: 'Поле email должно быть строкой' })
    @IsEmail({}, { message: 'Не верный формат email' })
    @IsSanitizedString({ message: 'Email содержит недопустимые символы' })
    declare readonly email: string;

    @ApiProperty({
        example: 'MySecure123!',
        description: 'Пароль (минимум 8 символов, включая заглавные, строчные буквы, цифры и спецсимволы)',
    })
    @IsNotEmpty({ message: 'Укажите пароль' })
    @IsString({ message: 'Поле пароля должно быть строкой' })
    @IsPasswordStrong({ message: 'Пароль не соответствует требованиям безопасности' })
    declare readonly password: string;
}
