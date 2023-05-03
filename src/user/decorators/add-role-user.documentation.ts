import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AddRoleDto } from '../dto/add-role.dto';

export function AddRoleUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Добавление роли пользователю` }),
	ApiBearerAuth('JWT-auth'),
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
