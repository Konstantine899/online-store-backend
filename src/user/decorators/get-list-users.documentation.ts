import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, OmitType } from '@nestjs/swagger';
import { UserModel } from '../user.model';

export function GetListUsersDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка всех пользователей` }),
	ApiResponse({
		description: `Get list users`,
		status: HttpStatus.OK,
		type: [
		OmitType(UserModel, ['roles', 'refresh_tokens', 'products', 'orders']),
		],
	}),
  );
}
