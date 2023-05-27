import { RoleModel } from '../role.model';
import { ApiProperty } from '@nestjs/swagger';

export class GetListRoleResponse extends RoleModel {
  @ApiProperty({ example: 1, description: `Идентификатор роли` })
  id: number;

  @ApiProperty({ example: `USER`, description: `Роль` })
  role: string;

  @ApiProperty({ example: `Пользователь`, description: `Описание роли` })
  description: string;
}
