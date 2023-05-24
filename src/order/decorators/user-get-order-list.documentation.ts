import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserOrderListResponse } from '../requests/user-order-list.response';

export function UserGetOrderListDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка заказов пользователя` }),
	ApiBearerAuth('JWT-auth'),
	ApiResponse({
		description: `User get list orders`,
		status: HttpStatus.OK,
		type: [UserOrderListResponse],
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
