import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function GetAllProductPropertiesDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение всех свойств продукта` }),
	ApiParam({
		name: `productId`,
		type: String,
		description: `Идентификатор  продукта`,
		required: true,
	}),
	ApiResponse({
		description: `Get product properties`,
		status: HttpStatus.OK,
		schema: {
		title: `Получение всех свойств продукта`,
		example: [
			{
			id: 9,
			name: 'Емкость аккумулятора: ',
			value: '5000 мА·ч',
			productId: 56,
			},
			{
			id: 10,
			name: 'Объем встроенной памяти ',
			value: '256 ГБ',
			productId: 56,
			},
		],
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		example: {
			title: `Свойства продукта не найдены`,
			statusCode: 404,
			url: '/online-store/product-property/product_id/56/properties',
			path: '/online-store/product-property/product_id/56/properties',
			name: 'NotFoundException',
			message: 'Свойства продукта не найдены',
		},
		},
	}),
  );
}
