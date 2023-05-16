import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function UserGetOrderDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение заказа пользователем` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `User get order`,
		status: HttpStatus.OK,
		schema: {
		title: `Полученный заказ`,
		example: {
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
		},
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Заказ не найден`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/order/user/get-order/711',
			path: '/online-store/order/user/get-order/711',
			name: 'NotFoundException',
			message: 'Заказ не найден',
		},
		},
	}),
  );
}
