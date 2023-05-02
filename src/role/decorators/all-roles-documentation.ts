import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function AllRolesDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Список ролей` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
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
