import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { GetListProductByCategoryIdResponse } from '../responses/get-list-product-by-category-id.response';

export function GetListProductByCategoryIdDocumentation() {
  return applyDecorators(
	ApiOperation({
		summary: `Получение отсортированного списка продуктов по категории товара`,
	}),
	ApiQuery({ name: `search`, type: `string`, required: false }),
	ApiQuery({ name: `sort`, type: `string`, required: false }),
	ApiQuery({
		name: `page`,
		type: Number,
		required: true,
		description: `Номер страницы`,
	}),
	ApiQuery({
		name: `size`,
		type: Number,
		required: true,
		description: `Количество элементов на странице`,
	}),
	ApiResponse({
		description: `Get list products by category`,
		status: HttpStatus.OK,
		type: GetListProductByCategoryIdResponse,
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Список найденных продуктов пуст`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/product/all/categoryId/2?page=1&size=1',
			path: '/online-store/product/all/categoryId/2',
			name: 'NotFoundException',
			message: 'По вашему запросу ничего не найдено',
		},
		},
	}),
  );
}
