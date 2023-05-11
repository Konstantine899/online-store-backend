import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateProductPropertyDto } from '../dto/create-product-property.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function CreateProductPropertyDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создать свойство продукта` }),
	ApiBearerAuth('JWT-auth'),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `productId`,
		type: String,
		description: `Идентификатор  продукта`,
		required: true,
	}),
	ApiBody({
		type: CreateProductPropertyDto,
		description: `Структура данных для создания свойства продукта`,
	}),
	ApiResponse({
		description: `Created product property`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Созданное свойство продукта`,
		example: {
			id: 10,
			productId: 56,
			name: 'Объем встроенной памяти ',
			value: '256 ГБ',
			updatedAt: '2023-05-10T11:46:40.961Z',
			createdAt: '2023-05-10T11:46:40.961Z',
		},
		},
	}),
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		anyOf: [
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: ['Имя свойства не должно быть пустым'],
				value: '',
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'value',
				messages: ['Значение свойства не должно быть пустым'],
				value: '',
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: ['Имя свойства  должно быть строкой'],
				value: 1,
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'value',
				messages: ['Значение свойства  должно быть строкой'],
				value: 1,
			},
			},
		],
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Не найден продукт`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/product-property/product_id/566/create',
			path: '/online-store/product-property/product_id/566/create',
			name: 'NotFoundException',
			message: 'Продукт не найден',
		},
		},
	}),
  );
}
