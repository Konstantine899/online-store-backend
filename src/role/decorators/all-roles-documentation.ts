import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function AllRolesDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Список ролей` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		status: HttpStatus.OK,
		schema: {
		title: `Список ролей`,
		example: [
			{
			id: 1,
			role: 'ADMIN',
			description: 'Администратор',
			},
			{
			id: 2,
			role: 'USER',
			description: 'Пользователь',
			},
			{
			id: 5,
			role: 'MANAGER',
			description: 'Менеджер',
			},
		],
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Роли пользователя не найдены`,
		example: {
			status: HttpStatus.NOT_FOUND,
			message: `Роли не найдены`,
		},
		},
	}),
  );
}
