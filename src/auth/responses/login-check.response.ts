import { HttpStatus } from '@nestjs/common';
import { UserModel } from '../../user/user.model';
import { ApiProperty } from '@nestjs/swagger';

export class LoginCheckResponse {
  @ApiProperty({ example: HttpStatus.OK })
  readonly status: HttpStatus;

  @ApiProperty({
	example: {
		id: 52,
		email: 'test@gmail.com',
		roles: [
		{
			id: 2,
			role: 'USER',
			description: 'Пользователь',
		},
		],
	},
  })
  readonly data: UserModel;
}
