import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function AdminGetListOrdersUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка заказов пользователя` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `Admin get list orders user`,
		status: HttpStatus.OK,
		schema: {
		title: `Список заказов пользователя`,
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
		anyOf: [
			{
			title: `Пользователь не найден в БД`,
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/order/admin/get-all-order/user/3',
				path: '/online-store/order/admin/get-all-order/user/3',
				name: 'NotFoundException',
				message: 'Пользователь не найден в БД',
			},
			},
			{
			title: 'Список заказов пользователя пуст',
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/order/admin/get-all-order/user/1',
				path: '/online-store/order/admin/get-all-order/user/1',
				name: 'NotFoundException',
				message: 'Список заказов пользователя пуст',
			},
			},
		],
		},
	}),
  );
}
