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
		description: `Login`,
		status: HttpStatus.OK,
		schema: {
		title: `Авторизованный пользователь`,
		example: {
			status: `success`,
			data: {
			payload: {
				type: 'bearer',
				accessToken:
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTEsInJvbGVzIjpbeyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgyODUzNTkxLCJleHAiOjE2ODI5Mzk5OTEsInN1YiI6IjUxIn0.swRpSMnpVymIUNibREskcfao11QxgibilYsJLVmkk88',
				refreshToken:
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODI4NTM1OTEsImV4cCI6MTY4MjkzOTk5MSwic3ViIjoiNTEiLCJqdGkiOiI2NSJ9.rgyg069iM_88PzF_ns9S_U1uC6abCN1axxn30Ro05Xo',
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
