import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddRoleDto {
  @Transform((value) => Number(value))
  readonly userId: number;

  @IsNotEmpty({ message: 'Укажите role пользователя' })
  @IsString({ message: 'Поле role должно быть строкой' })
  readonly role: string;
}
