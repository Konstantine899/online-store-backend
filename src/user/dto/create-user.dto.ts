import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
	example: `kostay375298918971@gmail.com`,
	description: `Электронный адрес пользователя`,
  })
  @IsNotEmpty({ message: 'Укажите email' })
  @IsEmail({}, { message: 'Не верный формат email' })
  readonly email: string;

  @ApiProperty({
	example: `123456`,
	description: `Пароль пользователя с минимальной длинной 6 символов`,
  })
  @IsNotEmpty({ message: 'Поле пароль не должно быть пустым' })
  @MinLength(6, {
	message: 'Пароль пользователя должен быть не менее 6 символов',
  })
  readonly password: string;
}
