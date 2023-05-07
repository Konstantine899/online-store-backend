import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateProductDto } from '../dto/create-product.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function UpdateProductDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Обновление продукта` }),
	ApiBearerAuth('JWT-auth'),
	ApiConsumes('multipart/form-data'),
	ApiParam({
		name: `id`,
		type: String,
		description: `идентификатор продукта`,
		required: true,
	}),
	ApiBody({
		type: CreateProductDto,
		description: `Структура входных данных для обновления продукта`,
	}),
	ApiResponse({
		description: `Updated product`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Тело ответа обновленного продукта`,
		example: {
			id: 54,
			name: 'Смартфон Xiaomi Redmi Note 11 Pro 4G 8GB/256GB RU (синий)',
			price: '3000',
			rating: 0,
			image: '1f6b1a4d-f2f4-4a82-a2e9-56ff47ced5c3.png',
			categoryId: '1',
			brandId: '1',
			properties: [
			{
				id: 3,
				name: 'Экран: ',
				value: '6.67  1080x2400 пикселей, AMOLED',
				productId: 54,
			},
			{
				id: 4,
				name: 'Процессор: ',
				value: 'Qualcomm Snapdragon 732G 2.3 ГГц',
				productId: 54,
			},
			{
				id: 5,
				name: 'Память: ',
				value: 'ОЗУ 8 ГБ , 256 ГБ',
				productId: 54,
			},
			{
				id: 6,
				name: 'Формат SIM-карты: ',
				value: 'Nano',
				productId: 54,
			},
			{
				id: 7,
				name: 'Количество мегапикселей камеры: ',
				value: '108 Мп',
				productId: 54,
			},
			{
				id: 8,
				name: 'Емкость аккумулятора: ',
				value: '5000 мА·ч',
				productId: 54,
			},
			],
			updatedAt: '2023-05-07T12:54:29.318Z',
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not found updated product`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Продукт не найден в БД`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/product/update/111',
			path: '/online-store/product/update/111',
			name: 'NotFoundException',
			message: 'Продукт с идентификатором 111 не найден в базе данных',
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
				messages: ['Имя не должно быть пустым'],
				value: '',
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'price',
				messages: [
				'Цена продукта должна быть числом c двумя знаками после точки',
				],
				value: null,
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				message: 'Поле image не должно быть пустым',
			},
			},
			{
			example: {
				status: HttpStatus.BAD_REQUEST,
				message: 'разрешены только файлы изображений',
			},
			},
			{
			example: {
				statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
				message: 'File too large',
				error: 'Payload Too Large',
			},
			},
		],
		},
	}),
  );
}
