import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Укажите роль пользователя' })
  @IsString({ message: 'Поле role должно быть строкой' })
  readonly role: string;

  @IsNotEmpty({ message: 'Укажите описание роли пользователя' })
  @IsString({ message: 'Поле описания роли должно быть строкой' })
  readonly description: string;
}
