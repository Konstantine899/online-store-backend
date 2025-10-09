import { IsString, Length, Matches, MinLength } from 'class-validator';

/**
 * DTO для сброса пароля по токену
 */
export class ResetPasswordDto {
    @IsString({ message: 'Токен должен быть строкой' })
    @Length(64, 64, { message: 'Некорректный формат токена' })
    declare readonly token: string;

    @IsString({ message: 'Пароль должен быть строкой' })
    @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
    @Matches(/(?=.*[a-z])/, {
        message: 'Пароль должен содержать хотя бы одну строчную букву',
    })
    @Matches(/(?=.*[A-Z])/, {
        message: 'Пароль должен содержать хотя бы одну заглавную букву',
    })
    @Matches(/(?=.*\d)/, {
        message: 'Пароль должен содержать хотя бы одну цифру',
    })
    @Matches(/(?=.*[@$!%*?&])/, {
        message:
            'Пароль должен содержать хотя бы один специальный символ (@$!%*?&)',
    })
    declare readonly newPassword: string;
}
