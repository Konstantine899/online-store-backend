import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function RemoveProductFromCartDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Удаление продукта из корзины` }),
	ApiCookieAuth(),
	ApiParam({
		name: `productId`,
		type: String,
		description: `Идентификатор продукта`,
		required: true,
	}),
	ApiResponse({
		description: `remove product from cart`,
		status: HttpStatus.OK,
		schema: {
		title: `Удаление продукта из корзины`,
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
			url: '/online-store/cart/product/55/remove',
			path: '/online-store/cart/product/55/remove',
			name: 'NotFoundException',
			message: 'Корзина с id:26 не найдена в БД',
		},
		},
	}),
  );
}
