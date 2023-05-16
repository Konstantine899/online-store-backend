import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  OmitType,
} from '@nestjs/swagger';
import { OrderDto } from '../dto/order.dto';
import { validateOrder } from './helpers/validate-order';

export function UserCreateOrderDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание заказа пользователем` }),
	ApiBearerAuth('JWT-auth'),
	ApiBody({
		type: OmitType(OrderDto, [`userId`]),
		description: `Входящая структура данных для создания заказа`,
	}),
	ApiResponse({
		description: `User create order`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Созданный заказ`,
		example: {
			id: 65,
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
			title: `Ваша корзина пуста`,
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
