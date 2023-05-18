import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function UpdateUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Обновление пользователя` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `идентификатор пользователя`,
		required: true,
	}),
	ApiBody({
		type: CreateUserDto,
		description: `Структура входных данных для обновления пользователя`,
	}),
	ApiResponse({
		description: `Updated user`,
		status: HttpStatus.OK,
		schema: {
		title: `Обновленный пользователь`,
		example: {
			id: 61,
			email: 'test2@gmail.com',
			roles: [
			{
				id: 2,
				role: 'USER',
				description: 'Пользователь',
			},
			],
		},
		},
	}),
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		anyOf: [
			{
			title: `Существующий email в БД`,
			example: {
				statusCode: HttpStatus.BAD_REQUEST,
				message:
				'Пользователь с таким email: test@gmail.com уже существует',
				error: 'Bad Request',
			},
			},
			{
			title: `Не верный формат email`,
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'email',
				messages: ['Не верный формат email'],
				value: 'testgmail.com',
			},
			},
			{
			title: `Валидация пароля`,
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'password',
				messages: [
				'Пароль пользователя должен быть не менее 6 символов',
				'Поле пароль не должно быть пустым',
				],
				value: '12345',
			},
			},
		],
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		anyOf: [
			{
			title: `Роль пользователя не найдена`,
			example: {
				status: HttpStatus.NOT_FOUND,
				message: `Пользователь с id: 61 не найден в БД`,
			},
			},
			{
			title: `Роль пользователя не найдена`,
			example: {
				status: HttpStatus.NOT_FOUND,
				message: `Роль USER не найдена`,
			},
			},
		],
		},
	}),
  );
}
