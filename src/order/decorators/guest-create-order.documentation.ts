import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { validateOrder } from './helpers/validate-order';

export function GuestCreateOrderDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание заказа гостем` }),
	ApiResponse({
		description: `User create order`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Созданный заказ`,
		example: {
			id: 73,
			name: 'Атрощенко Константин Анатольевич',
			email: 'test@mail.com',
			phone: '375298918971',
			address: 'г. Витебск ул Чкалова 41 к1 кв 73',
			amount: 1000,
			status: 0,
			comment: 'Комментарий заказчика',
			userId: null,
			items: [
			{
				name: 'Xiaomi 10pro',
				price: 1000,
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
			title: `Ваша корзина пуста`,
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/order/guest/create-order?id=574&cartId=31',
				path: '/online-store/order/guest/create-order',
				name: 'NotFoundException',
				message: 'Ваша корзина пуста',
			},
			},
			{
			title: `Корзина не найдена`,
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/order/guest/create-order?id=574&cartId=31',
				path: '/online-store/order/guest/create-order',
				name: 'NotFoundException',
				message: `Корзины с id:26 не найдена БД`,
			},
			},
		],
		},
	}),
	ApiBadRequestResponse(validateOrder()),
  );
}
