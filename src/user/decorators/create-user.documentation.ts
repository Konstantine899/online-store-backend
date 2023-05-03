import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
  OmitType,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserModel } from '../user.model';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function CreateUserDocumentation() {
  return applyDecorators(
	ApiBearerAuth('JWT-auth'),
	ApiOperation({ summary: `Создание пользователя` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
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
