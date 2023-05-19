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
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

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
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/user/role/add',
				path: '/online-store/user/role/add',
				name: 'NotFoundException',
				message: 'Пользователь не найден в БД',
			},
			},
			{
			title: 'Роль пользователя',
			description: `Роль не найдена в БД`,
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/user/role/add',
				path: '/online-store/user/role/add',
				name: 'NotFoundException',
				message: 'Роль не найдена в БД',
			},
			},
		],
		},
	}),
	ApiConflictResponse({
		description: `Conflict`,
		status: HttpStatus.CONFLICT,
		schema: {
		example: {
			statusCode: HttpStatus.CONFLICT,
			message: 'Данному пользователю уже присвоена роль ADMIN',
		},
		},
	}),
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		title: `Валидация`,
		anyOf: [
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'role',
				messages: ['Укажите role пользователя'],
				value: '',
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'role',
				messages: ['Поле role должно быть строкой'],
				value: 1,
			},
			},
		],
		},
	}),
  );
}
