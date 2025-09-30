import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsPasswordStrong } from '@app/infrastructure/common/validators/password-strength.validator';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';

export class UpdateUserDto {
    @ApiPropertyOptional({
        example: 'new@mail.com',
        description: 'Новый электронный адрес пользователя',
    })
    @IsOptional()
    @IsString({ message: 'Поле email должно быть строкой' })
    @IsEmail({}, { message: 'Не верный формат email' })
    @IsSanitizedString({ message: 'Email содержит недопустимые символы' })
    declare readonly email?: string;

    @ApiPropertyOptional({
        example: 'NewSecure123!',
        description:
            'Новый пароль пользователя (минимум 8 символов, включая заглавные, строчные буквы, цифры и спецсимволы)',
    })
    @IsOptional()
    @IsString({ message: 'Поле пароля должно быть строкой' })
    @IsPasswordStrong({ message: 'Пароль недостаточно сложный' })
    declare readonly password?: string;
}


