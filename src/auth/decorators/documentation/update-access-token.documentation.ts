import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { RefreshDto } from '../../dto/refresh.dto';

export function UpdateAccessTokenDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Обновление access token` }),
	ApiBody({
		type: RefreshDto,
		description: `Структура данных для обновления access token`,
	}),
	ApiResponse({
		description: `Updated Access Token`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Обновленные Access и Refresh tokens`,
		example: {
			status: HttpStatus.CREATED,
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
	ApiNotFoundResponse({
		status: HttpStatus.NOT_FOUND,
		schema: {
		example: {
			title: `Refresh token не найден в БД`,
			example: {
			status: HttpStatus.UNPROCESSABLE_ENTITY,
			message: 'Refresh token не найден в БД',
			error: 'Unprocessable Entity',
			},
		},
		},
	}),
	ApiUnprocessableEntityResponse({
		description: `Unprocessable Entity`,
		status: HttpStatus.UNPROCESSABLE_ENTITY,
		schema: {
		anyOf: [
			{
			title: `id refresh token не получен из payload`,

			example: {
				status: HttpStatus.UNPROCESSABLE_ENTITY,
				message: 'id refresh token не получен из payload',
				error: 'Unprocessable Entity',
			},
			},
			{
			title: `'Не верный формат refresh token'`,

			example: {
				status: HttpStatus.UNPROCESSABLE_ENTITY,
				message: 'Не верный формат refresh token',
				error: 'Unprocessable Entity',
			},
			},
			{
			title: `Срок действия refresh token истек`,
			description: `Refresh token с истекшим сроком действия`,
			example: {
				status: HttpStatus.UNPROCESSABLE_ENTITY,
				message: 'Срок действия refresh token истек',
				error: 'Unprocessable Entity',
			},
			},
		],
		},
	}),
  );
}
