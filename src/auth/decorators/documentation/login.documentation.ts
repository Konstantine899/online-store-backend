import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from '../../dto/login.dto';

export function LoginDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Аутентификация` }),
	ApiBody({
		type: LoginDto,
		description: `Структура входных данных для аутентификации пользователя`,
	}),
	ApiResponse({
		description: `Created`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Зарегистрированный пользователь`,
		example: {
			status: `success`,
			data: {
			user: {
				id: 50,
				email: 'test1@gmail.com',
				roles: [
				{
					id: 2,
					role: 'USER',
					description: 'Пользователь',
				},
				],
			},
			payload: {
				type: 'bearer',
				accessToken:
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJvbGVzIjpbeyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgyNjg3ODk4LCJleHAiOjE2ODI3NzQyOTgsInN1YiI6IjUwIn0.vyUxpplAmZa-6sLGnI7HIMiBAJw6CPY9yh_25ZfqDHM',
				refreshToken:
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODI2ODc4OTgsImV4cCI6MTY4Mjc3NDI5OCwic3ViIjoiNTAiLCJqdGkiOiI2MCJ9.6FfKlqEExNMTYHMfsM7Imcc_wEq2zCIS4rjgcEVa4y0',
			},
			},
		},
		},
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
