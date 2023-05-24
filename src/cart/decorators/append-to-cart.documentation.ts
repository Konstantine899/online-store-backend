import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AppendToCartResponse } from '../responses/append-to-cart.response';

export function AppendToCartDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Добавление продукта в корзину` }),
	ApiBearerAuth('JWT-auth'),
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
		type: AppendToCartResponse,
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
