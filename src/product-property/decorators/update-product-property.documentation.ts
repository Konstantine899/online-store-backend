import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateProductPropertyDto } from '../dto/create-product-property.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function UpdateProductPropertyDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Обновление свойства продукта` }),
	ApiParam({
		name: `productId`,
		type: String,
		description: `Идентификатор  продукта`,
		required: true,
	}),
	ApiParam({
		name: `id`,
		type: String,
		description: `Идентификатор свойства  продукта`,
		required: true,
	}),
	ApiBody({
		type: CreateProductPropertyDto,
		description: `Структура данных для обновления свойства продукта`,
	}),
	ApiResponse({
		description: `Updated product property`,
		status: HttpStatus.OK,
		schema: {
		title: `Обновленное свойство продукта`,
		example: {
			id: 13,
			name: 'Объем встроенной памяти ',
			value: '256 ГБ',
			productId: 56,
		},
		},
	}),
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		anyOf: [
			{
			title: 'Имя свойства не должно быть пустым',
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: ['Имя свойства не должно быть пустым'],
				value: '',
			},
			},
			{
			title: `Значение свойства не должно быть пустым`,
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'value',
				messages: ['Значение свойства не должно быть пустым'],
				value: '',
			},
			},
			{
			title: `Имя свойства  должно быть строкой`,
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: ['Имя свойства  должно быть строкой'],
				value: 1,
			},
			},
			{
			title: `Значение свойства  должно быть строкой`,
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
		anyOf: [
			{
			title: 'Продукт не найден',
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/product-property/product_id/566/create',
				path: '/online-store/product-property/product_id/566/create',
				name: 'NotFoundException',
				message: 'Продукт не найден',
			},
			},
			{
			title: 'Свойство продукта не найдено',
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/product-property/product_id/56/update_property/134',
				path: '/online-store/product-property/product_id/56/update_property/134',
				name: 'NotFoundException',
				message: 'Свойство продукта не найдено',
			},
			},
		],
		},
	}),
  );
}
