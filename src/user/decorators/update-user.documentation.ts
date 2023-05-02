import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  OmitType,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserModel } from '../user.model';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function UpdateUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Обновление пользователя` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `идентификатор пользователя`,
	}),
	ApiBody({
		type: CreateUserDto,
		description: `Структура входных данных для обновления пользователя`,
	}),
	ApiResponse({
		description: `Updated user`,
		status: HttpStatus.OK,
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
			statusCode: 400,
			message: 'Пользователь с таким email: user@email.com уже существует',
			error: 'Bad Request',
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Роль пользователя не найдена`,
		example: {
			status: 404,
			message: 'Роль USER не найдена',
		},
		},
	}),
  );
}
