import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AddRoleDto } from '../dto/add-role.dto';

export function AddRoleUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Добавление роли пользователю` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
	ApiBody({
		type: AddRoleDto,
		description: `Структура входных данных для добавления роли пользователю`,
	}),
	ApiCreatedResponse({
		description: `Add Role`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Добавленная роль`,
		example: [{ id: 1, userId: 1, roleId: 1 }],
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		anyOf: [
			{
			title: 'Пользователь',
			description: `Пользователь не найден в БД`,
			example: {
				statusCode: 404,
				message: 'Пользователь не найден в БД',
			},
			},
			{
			title: 'Роль пользователя',
			description: `Роль не найдена в БД`,
			example: { statusCode: 404, message: 'Роль не найдена в БД' },
			},
		],
		},
	}),
	ApiConflictResponse({
		description: `Conflict`,
		status: HttpStatus.CONFLICT,
		schema: {
		example: {
			statusCode: 409,
			message: 'Данному пользователю уже присвоена роль ADMIN',
		},
		},
	}),
  );
}
