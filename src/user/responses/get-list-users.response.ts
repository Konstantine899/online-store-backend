import { UserModel } from '../user.model';
import { ApiProperty } from '@nestjs/swagger';

export class GetListUsersResponse extends UserModel {
  @ApiProperty({ example: 1, description: `Идентификатор пользователя` })
  id: number;

  @ApiProperty({
	example: `test@mail.com`,
	description: `Электронная почта пользователя`,
  })
  email: string;
}
