import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveRoleDto {
  @Transform((value) => Number(value))
  readonly userId: number;

  @IsNotEmpty({ message: 'Укажите role пользователя' })
  @IsString({ message: 'Поле role должно быть строкой' })
  readonly role: string;
}
