import { UserModel } from '../user.model';
import { ApiProperty } from '@nestjs/swagger';
import { RoleModel } from '../../role/role.model';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserResponse extends UserModel {
  @ApiProperty({ example: 1, description: `Идентификатор пользователя` })
  id: number;

  @ApiProperty({
	example: `test@mail.com`,
	description: `Электронная почта пользователя`,
  })
  email: string;

  @ApiProperty({ type: () => [RoleModel] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleModel)
  roles: RoleModel[];
}
