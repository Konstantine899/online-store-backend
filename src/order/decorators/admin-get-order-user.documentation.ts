import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function AdminGetOrderUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение заказа пользователя администратором` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `orderId`,
		type: String,
		description: `идентификатор заказа`,
		required: true,
	}),
	ApiResponse({
		description: `Admin get order user`,
		status: HttpStatus.OK,
		schema: {
		title: `Получение заказа пользователя администратором`,
		example: {
			id: 23,
			name: 'Константин',
			email: '375298918971@gmail.com',
			phone: '375298918971',
			address: 'г. Витебск ул Чкалова 41 к1 кв 73',
			amount: 6000,
			status: 0,
			comment: null,
			userId: 1,
			items: [
			{
				name: 'Xiaomi 12S',
				price: 2000,
				quantity: 2,
			},
			{
				name: 'Xiaomi 10pro',
				price: 1000,
				quantity: 1,
			},
			{
				name: 'Xiaomi 11pro',
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
		title: 'Заказ не найден',
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/order/admin/get-order/233',
			path: '/online-store/order/admin/get-order/233',
			name: 'NotFoundException',
			message: 'Заказ не найден',
		},
		},
	}),
  );
}
