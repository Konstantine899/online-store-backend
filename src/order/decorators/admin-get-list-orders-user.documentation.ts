import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminGetListOrdersUserResponse } from '../requests/admin-get-list-orders-user.response';

export function AdminGetListOrdersUserDocumentation() {
  return applyDecorators(
	ApiOperation({
		summary: `Получение списка заказов пользователя администратором`,
	}),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `Admin get list orders user`,
		status: HttpStatus.OK,
		type: [AdminGetListOrdersUserResponse],
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
