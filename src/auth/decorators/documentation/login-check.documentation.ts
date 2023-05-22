import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginCheckRequest } from '../../requests/login-check.request';

export function LoginCheckDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Профиль пользователя` }),
	ApiBearerAuth('JWT-auth'),
	ApiBody({
		type: LoginCheckRequest,
		description: `Это описание тела запроса в котором содержится пользователь т.е. request.user`,
		required: true,
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
