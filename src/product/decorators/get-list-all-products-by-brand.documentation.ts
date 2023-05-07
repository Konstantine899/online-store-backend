import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

export function GetListAllProductsByBrandDocumentation() {
  return applyDecorators(
	ApiOperation({
		summary: `Получение отсортированного списка продуктов по бренду товара`,
	}),
	ApiParam({
		name: `brandId`,
		type: String,
		description: `идентификатор бренда`,
		required: true,
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
		description: `Get list products by brand`,
		status: HttpStatus.OK,
		schema: {
		title: `Список продуктов отсортированных по brandId`,
		example: {
			metaData: {
			totalCount: 4,
			lastPage: 4,
			currentPage: 1,
			nextPage: 2,
			previousPage: 0,
			},
			rows: [
			{
				id: 54,
				name: 'Смартфон Xiaomi Redmi Note 12 Pro 4G 8GB/256GB RU (синий)',
				price: 1149,
				rating: 0,
				image: '926429b8-69bf-439b-b9be-6f4893d7bab9.jpg',
				categoryId: 1,
				brandId: 1,
			},
			],
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Список найденных продуктов пуст`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/product/all/brandId/2',
			path: '/online-store/product/all/brandId/2',
			name: 'NotFoundException',
			message: 'По вашему запросу ничего не найдено',
		},
		},
	}),
  );
}
