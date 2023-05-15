import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OrderDto } from '../dto/order.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function AdminCreateOrderDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание заказа администратором` }),
	ApiBearerAuth('JWT-auth'),
	ApiBody({
		type: OrderDto,
		description: `Структура входных данных для создания заказа`,
	}),
	ApiResponse({
		description: `Admin create order`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Созданный заказ администратором`,
		example: {
			id: 50,
			name: 'Атрощенко константин Анатольевич',
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
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		title: `Валидация`,
		anyOf: [
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: ['Укажите ФИО заказчика'],
				value: '',
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: [`Поле ФИО не должно превышать 100 символов`],
				value: '',
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'email',
				messages: ['Укажите email заказчика'],
				value: null,
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'email',
				messages: ['email must be an email'],
				value: '375298918971gmail.com',
			},
			},

			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: `phone`,
				messages: ['Укажите контактный номер заказчика'],
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: `phone`,
				messages: [`Максимальная длинна телефона 15 символов`],
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: `address`,
				messages: ['Укажите адрес доставки'],
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: `address`,
				messages: ['Укажите адрес доставки'],
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: `address`,
				messages: [`Максимальная длинна 200 символов`],
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: `comment`,
				messages: [`Максимальная длинна 2200 символов`],
			},
			},
		],
		},
	}),
  );
}
