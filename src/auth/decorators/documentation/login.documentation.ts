import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from '../../dto/login.dto';
import { LoginResponse } from '../../responses/login.response';

export function LoginDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Аутентификация` }),
	ApiBody({
		type: LoginDto,
		description: `Структура входных данных для аутентификации пользователя`,
	}),
	ApiResponse({
		description: `Login`,
		status: HttpStatus.OK,
		type: LoginResponse,
	}),
	ApiUnauthorizedResponse({
		description: `Unauthorized Response`,
		status: HttpStatus.UNAUTHORIZED,
		schema: {
		anyOf: [
			{
			title: `Не верно введенный email`,
			description: `Не верно введенный email`,
			example: {
				status: HttpStatus.UNAUTHORIZED,
				message: 'Не корректный email',
			},
			},
			{
			title: `Не верно введенный пароль`,
			description: `Не верно введенный пароль`,
			example: {
				status: HttpStatus.UNAUTHORIZED,
				message: 'Не корректный пароль',
			},
			},
		],
		},
	}),
  );
}
