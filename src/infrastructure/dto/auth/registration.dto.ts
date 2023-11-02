import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TRegistration } from '../../../domain/dto/auth/I-auth-dto';

export class RegistrationDto implements TRegistration {
    @ApiProperty({
        example: 'test@mail.com',
        description: 'Адрес электронной почты',
    })
    @IsNotEmpty({ message: 'Укажите email' })
    @IsEmail({}, { message: 'Не верный формат email' })
    readonly email: string;

    @ApiProperty({
        example: '123456',
        description: 'Пароль',
    })
    @IsNotEmpty({ message: 'Укажите пароль' })
    @MinLength(6, {
        message: 'Пароль пользователя должен быть не менее 6 символов',
    })
    readonly password: string;
}
