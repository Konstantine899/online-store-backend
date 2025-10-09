import { IsSanitizedString } from '@app/infrastructure/common/validators';
import { IsEmail } from 'class-validator';

/**
 * DTO для запроса сброса пароля
 */
export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Некорректный формат email' })
    @IsSanitizedString({
        message: 'Email содержит недопустимые символы',
    })
    declare readonly email: string;
}
