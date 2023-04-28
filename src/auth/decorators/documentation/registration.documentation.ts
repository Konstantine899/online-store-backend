import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../../dto/register.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function RegistrationDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Регистрация` }),
	ApiBody({
		type: RegisterDto,
		description: `Структура входных данных для регистрации пользователя`,
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
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		title: `Электронная почта найдена в БД`,
		description: `Электронная почта должна быть уникальной`,
		example: {
			status: HttpStatus.BAD_REQUEST,
			message: 'Пользователь с таким email: test@gmail.com уже существует',
		},
		},
	}),
  );
}
