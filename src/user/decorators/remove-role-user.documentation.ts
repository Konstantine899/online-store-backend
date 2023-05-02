import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RemoveRoleDto } from '../dto/remove-role.dto';

export function RemoveRoleUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Удаление роли у пользователя` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
	ApiBody({
		description: `Входные данные для удаления пользователя`,
		type: RemoveRoleDto,
	}),
	ApiResponse({
		description: `Remove Role`,
		status: HttpStatus.OK,
		schema: { title: `Количество удаленных записей из БД`, example: 1 },
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		anyOf: [
			{
			title: 'Поиск не существующего пользователя',
			description: `Пользователь не найден в БД`,
			example: {
				statusCode: 404,
				message: 'Пользователь не найден в БД',
			},
			},
			{
			title: `Удаление роли которой нет у пользователя`,
			description: `Удаление роли пользователя которая ему не принадлежит`,
			example: {
				statusCode: 404,
				message: `Роль ADMIN не принадлежит данному пользователю`,
			},
			},
		],
		},
	}),
	ApiForbiddenResponse({
		description: `Forbidden`,
		status: HttpStatus.FORBIDDEN,
		schema: {
		title: `Запрет удаления роли USER`,
		example: {
			status: 403,
			message: 'Удаление роли USER запрещено',
		},
		},
	}),
  );
}
