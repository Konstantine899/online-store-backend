import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function AdminGetListOfAllStoreOrdersDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка всех заказов магазина` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `Admin get list of all store orders`,
		status: HttpStatus.OK,
		schema: {
		title: `Список заказов магазина`,
		example: [
			{
			id: 23,
			name: 'Константин',
			email: '375298918971@gmail.com',
			phone: '375298918971',
			address: 'г. Витебск ул Чкалова 41 к1 кв 73',
			amount: 6000,
			status: 0,
			comment: null,
			userId: 1,
			},
		],
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Список заказов магазина пуст`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/order/admin/get-all-order',
			path: '/online-store/order/admin/get-all-order',
			name: 'NotFoundException',
			message: `Список заказов магазина пуст`,
		},
		},
	}),
  );
}
