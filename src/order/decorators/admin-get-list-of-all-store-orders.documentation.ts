import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminGetListOfAllStoreOrdersResponse } from '../requests/admin-get-list-of-all-store-orders.response';

export function AdminGetListOfAllStoreOrdersDocumentation() {
  return applyDecorators(
	ApiOperation({
		summary: `Получение списка всех заказов магазина администратором`,
	}),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `Admin get list of all store orders`,
		status: HttpStatus.OK,
		type: AdminGetListOfAllStoreOrdersResponse,
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
