import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TLogin } from '@app/domain/dto';

export class LoginDto implements TLogin {
    @ApiProperty({
        example: 'test@mail.com',
        description: 'Адрес электронной почты',
    })
    @IsNotEmpty({ message: 'Укажите email' })
    @IsString({ message: 'Поле email должно быть строкой' })
    @IsEmail({}, { message: 'Не верный формат email' })
    readonly email: string;

    @ApiProperty({
        example: '123456',
        description: 'Пароль',
    })
    @IsNotEmpty({ message: 'Укажите пароль' })
    @IsString({ message: 'Поле пароля должно быть строкой' })
    @MinLength(6, {
        message: 'Пароль пользователя должен быть не менее 6 символов',
    })
    readonly password: string;
}
