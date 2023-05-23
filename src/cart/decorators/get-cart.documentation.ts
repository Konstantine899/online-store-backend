import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CartResponse } from '../responses/cart.response';

export function GetCartDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение корзины` }),
	ApiBearerAuth('JWT-auth'),
	ApiCookieAuth(),
	ApiResponse({
		description: `Get cart`,
		status: HttpStatus.OK,
		type: CartResponse,
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Корзина не найдена в БД`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/cart/get-cart',
			path: '/online-store/cart/get-cart',
			name: 'NotFoundException',
			message: 'Корзина с id:26 не найдена в БД',
		},
		},
	}),
  );
}
