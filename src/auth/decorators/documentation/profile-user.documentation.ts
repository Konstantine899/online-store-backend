import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

export function ProfileUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Профиль пользователя` }),
	ApiQuery({
		name: `Идентификатор пользователя`,
		description: `Идентификатор пользователя`,
		type: `number`,
		required: true,
		example: `1`,
	}),
	ApiResponse({
		status: HttpStatus.OK,
		schema: {
		example: {
			data: {
			id: 1,
			email: 'test@gmail.com',
			orders: [
				{
				id: 40,
				name: 'Константин',
				email: 'test@gmail.com',
				phone: '375298992917',
				address: 'г. Минск пр Независимости 15 кв 100',
				amount: 1000,
				status: 0,
				comment: null,
				userId: 51,
				items: [
					{
					name: 'Xiaomi 10pro',
					price: 1000,
					quantity: 1,
					},
				],
				},
			],
			},
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: 'Профиль пользователя не найден в БД',
		example: {
			statusCode: 404,
			message: `Профиль пользователя не найден в БД`,
		},
		},
	}),
  );
}
