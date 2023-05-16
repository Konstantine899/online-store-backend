import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function UserGetListOrdersDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка заказов пользователя` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `User get list orders`,
		status: HttpStatus.OK,
		schema: {
		title: `Список заказов`,
		example: [
			{
			id: 64,
			name: 'Константин',
			email: 'test@gmail.com',
			phone: '375298992917',
			address: 'г. Минск пр Независимости 15 кв 100',
			amount: 1000,
			status: 0,
			comment: null,
			userId: 57,
			items: [
				{
				name: 'Xiaomi 10pro',
				price: 1000,
				quantity: 1,
				},
			],
			},
			{
			id: 70,
			name: 'Атрощенко Константин Анатольевич',
			email: 'test@mail.com',
			phone: '375298918971',
			address: 'г. Витебск ул Чкалова 41 к1 кв 73',
			amount: 1000,
			status: 0,
			comment: 'Комментарий заказчика',
			userId: 57,
			items: [
				{
				name: 'Xiaomi 10pro',
				price: 1000,
				quantity: 1,
				},
			],
			},
			{
			id: 71,
			name: 'Атрощенко Константин Анатольевич',
			email: 'test@mail.com',
			phone: '375298918971',
			address: 'г. Витебск ул Чкалова 41 к1 кв 73',
			amount: 1000,
			status: 0,
			comment: 'Комментарий заказчика',
			userId: 57,
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
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Заказы не найдены`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/order/user/get-all-order',
			path: '/online-store/order/user/get-all-order',
			name: 'NotFoundException',
			message: 'Заказы не найдены',
		},
		},
	}),
  );
}
