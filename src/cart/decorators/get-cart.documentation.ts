import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function GetCartDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение корзины` }),
	ApiCookieAuth(),
	ApiResponse({
		description: `Get cart`,
		status: HttpStatus.OK,
		schema: {
		title: `Получение корзины`,
		example: {
			cartId: 26,
			products: [
			{
				productId: 55,
				name: 'Смартфон Xiaomi Redmi Note 13 Pro 4G 8GB/256GB RU (синий)',
				price: 1149,
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
