import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function GetProductPropertyDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение свойства продукта` }),
	ApiBearerAuth('JWT-auth'),
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
	ApiResponse({
		description: `Get product property`,
		status: HttpStatus.OK,
		schema: {
		title: `Получение свойства продукта`,
		example: {
			id: 10,
			name: 'Объем встроенной памяти ',
			value: '256 ГБ',
			productId: 56,
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		anyOf: [
			{
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/product-property/product_id/566/get-property/10',
				path: '/online-store/product-property/product_id/566/get-property/10',
				name: 'NotFoundException',
				message: 'Продукт не найден',
			},
			},
			{
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				url: '/online-store/product-property/product_id/56/get-property/101',
				path: '/online-store/product-property/product_id/56/get-property/101',
				name: 'NotFoundException',
				message: 'Свойство продукта не найдено',
			},
			},
		],
		},
	}),
  );
}
