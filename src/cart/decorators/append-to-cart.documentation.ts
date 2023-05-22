import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function AppendToCartDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Добавление продукта в корзину` }),
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
		description: `Product added to cart`,
		status: HttpStatus.OK,
		schema: {
		title: `Продукт добавлен в корзину`,
		example: {
			cartId: 25,
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
		anyOf: [
			{
			title: `Корзина не найдена в БД`,
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/cart/product/55/append/1',
				path: '/online-store/cart/product/55/append/1',
				name: 'NotFoundException',
				message: 'Корзина с id:25 не найдена в БД',
			},
			},
			{
			title: `Продукт не найден в БД`,
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/cart/product/56/append/1',
				path: '/online-store/cart/product/56/append/1',
				name: 'NotFoundException',
				message: 'Продукт с id:56 не найден в БД',
			},
			},
		],
		},
	}),
  );
}
