import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function ClearCartDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Очистка корзины` }),
	ApiCookieAuth(),
	ApiResponse({
		description: `Clear cart`,
		status: HttpStatus.OK,
		schema: {
		title: `Очистка корзины корзины`,
		example: {
			cartId: 26,
			products: [],
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Корзина не найдена в БД`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/cart/clear',
			path: '/online-store/cart/clear',
			name: 'NotFoundException',
			message: 'Корзина с id:26 не найдена в БД',
		},
		},
	}),
  );
}
