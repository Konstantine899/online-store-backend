import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddRoleDto {
  @Transform((value) => Number(value))
  readonly userId: number;

  @IsString()
  readonly role: string;
}
