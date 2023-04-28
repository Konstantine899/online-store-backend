import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  OmitType,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserModel } from '../user.model';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function CreateUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание пользователя` }),
	ApiBody({
		type: CreateUserDto,
		description: `Структура входных данных для создания пользователя`,
	}),
	ApiCreatedResponse({
		description: `Create user`,
		type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
		]),
	}),
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		title: `Существующий email в БД`,
		example: {
			message: `Пользователь с таким email: test@gmail.com уже существует`,
			error: 'Bad Request',
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Роль USER не найдена в БД`,
		example: {
			status: 404,
			message: `Роль USER не найдена в БД`,
		},
		},
	}),
  );
}
