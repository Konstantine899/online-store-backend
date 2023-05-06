import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

export function GetListAllProductsDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка всех продуктов` }),
	ApiQuery({ name: `search`, type: `string`, required: false }),
	ApiQuery({ name: `sort`, type: `string`, required: false }),
	ApiQuery({
		name: `page`,
		type: `number`,
		required: true,
		description: `Номер страницы`,
	}),
	ApiQuery({
		name: `size`,
		type: `number`,
		required: true,
		description: `Количество элементов на странице`,
	}),
	ApiResponse({
		description: `Get list products`,
		status: HttpStatus.OK,
		schema: {
		title: `Список продуктов`,
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
			url: '/online-store/product/all?search=Xiaomi%20Redmi%20Note%2010ww',
			path: '/online-store/product/all',
			name: 'NotFoundException',
			message: 'По вашему запросу ничего не найдено',
		},
		},
	}),
  );
}
