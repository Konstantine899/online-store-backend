import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OrderDto } from '../dto/order.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { validateOrder } from './helpers/validate-order';

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
	ApiBadRequestResponse(validateOrder()),
  );
}
