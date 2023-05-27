import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateProductDto } from '../dto/create-product.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { CreateProductResponse } from '../responses/create-product.response';

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
		type: CreateProductResponse,
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
	ApiConflictResponse({
		description: 'Conflict',
		status: HttpStatus.CONFLICT,
		schema: {
		example: {
			statusCode: HttpStatus.CONFLICT,
			message: `Произошел конфликт при записи файла в файловую систему`,
		},
		},
	}),
  );
}
