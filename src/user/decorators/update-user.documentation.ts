import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
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
