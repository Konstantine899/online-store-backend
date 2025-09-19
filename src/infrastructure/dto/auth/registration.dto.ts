import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TRegistration } from '@app/domain/dto';

export class RegistrationDto implements TRegistration {
    @ApiProperty({
        example: 'test@mail.com',
        description: 'Адрес электронной почты',
    })
    @IsNotEmpty({ message: 'Поле email не должно быть пустым' })
    @IsString({ message: 'Поле email должно быть строкой' })
    @IsEmail({}, { message: 'Не верный формат email' })
    declare readonly email: string;

    @ApiProperty({
        example: '123456',
        description: 'Пароль',
    })
    @IsNotEmpty({ message: 'Поле пароль не должно быть пустым' })
    @IsString({ message: 'Поле пароля должно быть строкой' })
    @MinLength(6, {
        message: 'Пароль пользователя должен быть не менее 6 символов',
    })
    declare readonly password: string;
}
