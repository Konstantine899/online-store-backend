import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function GetListUsersDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка всех пользователей` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `Get list users`,
		status: HttpStatus.OK,
		schema: {
		title: `Список всех пользователей`,
		example: [
			{
			id: 1,
			email: 'kostay375298918971@gmail.com',
			},
			{
			id: 57,
			email: 'test@gmail.com',
			},
			{
			id: 61,
			email: 'test1@gmail.com',
			},
		],
		},
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
