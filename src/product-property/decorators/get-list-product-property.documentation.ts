import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { GetListProductPropertyResponse } from '../responses/get-list-product-property.response';

export function GetListProductPropertyDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение всех свойств продукта` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `productId`,
		type: String,
		description: `Идентификатор  продукта`,
		required: true,
	}),
	ApiResponse({
		description: `Get product properties`,
		status: HttpStatus.OK,
		type: [GetListProductPropertyResponse],
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
