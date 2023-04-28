import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Укажите email' })
  @IsEmail({}, { message: 'Не верный формат email' })
  readonly email: string;

  @IsNotEmpty({ message: 'Укажите пароль' })
  @MinLength(6, {
	message: 'Пароль пользователя должен быть не менее 6 символов',
  })
  readonly password: string;
}
