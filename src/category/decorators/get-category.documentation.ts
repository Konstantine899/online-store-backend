import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function GetCategoryDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение категории` }),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `Идентификатор категории`,
		required: true,
	}),
	ApiResponse({
		description: `Get category`,
		status: HttpStatus.OK,
		schema: {
		title: `Полученная категория`,
		example: {
			id: 4,
			name: 'Компьютеры',
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Категория не найдена`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/category/one/44',
			path: '/online-store/category/one/44',
			name: 'NotFoundException',
			message: 'Категория товара не найдена',
		},
		},
	}),
  );
}
