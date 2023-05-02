import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GetProfileUserRequest } from '../../requests/get-profile-user.request';

export function ProfileUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Профиль пользователя` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
	ApiBody({
		type: GetProfileUserRequest,
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
