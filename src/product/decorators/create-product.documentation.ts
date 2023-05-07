import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateProductDto } from '../dto/create-product.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function CreateProductDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание продукта` }),
	ApiBearerAuth('JWT-auth'),
	ApiConsumes('multipart/form-data'),
	ApiBody({
		type: CreateProductDto,
		description: `Структура входных данных для создания продукта`,
	}),
	ApiResponse({
		description: `Created product`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Тело ответа созданного продукта`,
		example: {
			rating: 0,
			id: 50,
			name: 'Xiaomi Redmi 11 pro',
			price: '2000',
			brandId: '1',
			categoryId: '1',
			image: '471d35be-9906-4cee-a681-76a53a19bd25.png',
			updatedAt: '2023-05-04T17:50:12.370Z',
			createdAt: '2023-05-04T17:50:12.370Z',
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
