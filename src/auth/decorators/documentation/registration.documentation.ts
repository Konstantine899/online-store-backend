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
