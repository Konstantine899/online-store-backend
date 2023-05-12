import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function DecrementDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Уменьшение количества товара в корзине` }),
	ApiCookieAuth(),
	ApiParam({
		name: `productId`,
		type: String,
		description: `Идентификатор продукта`,
		required: true,
	}),
	ApiParam({
		name: `quantity`,
		type: String,
		description: `Количество продуктов`,
		required: true,
	}),
	ApiResponse({
		description: `decrement quantity`,
		status: HttpStatus.OK,
		schema: {
		title: `Уменьшение количества продукта`,
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
			url: '/online-store/cart/product/55/decrement/1',
			path: '/online-store/cart/product/55/decrement/1',
			name: 'NotFoundException',
			message: 'Корзина с id:26 не найдена в БД',
		},
		},
	}),
  );
}
