import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class RemoveRoleDto {
  @Transform((value) => Number(value))
  readonly userId: number;

  @IsString()
  readonly role: string;
}
