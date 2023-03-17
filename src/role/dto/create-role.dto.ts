import { IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Укажите роль пользователя' })
  readonly role: string;

  @IsNotEmpty({ message: 'Укажите описание к роли пользователя' })
  readonly description: string;
}
