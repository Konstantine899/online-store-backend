import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GetListUsersResponse } from '../responses/get-list-users.response';

export function GetListUsersDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка всех пользователей` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `Get list users`,
		status: HttpStatus.OK,
		type: [GetListUsersResponse],
	}),
	ApiNotFoundResponse({
		description: `List users is empty`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Список пользователей пуст`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/user/get-list-users',
			path: '/online-store/user/get-list-users',
			name: 'NotFoundException',
			message: `Список пользователей пуст`,
		},
		},
	}),
  );
}
