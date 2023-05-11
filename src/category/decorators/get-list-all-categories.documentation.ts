import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function GetListAllCategoriesDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка всех категорий` }),
	ApiResponse({
		description: `Get list all categories`,
		status: HttpStatus.OK,
		schema: {
		title: `Список всех категорий`,
		example: [
			{
			id: 4,
			name: 'Компьютеры',
			},
			{
			id: 7,
			name: 'Ноутбуки',
			},
			{
			id: 1,
			name: 'Смартфоны',
			},
			{
			id: 2,
			name: 'Телевизоры',
			},
			{
			id: 3,
			name: 'Холодильники',
			},
		],
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Список категорий пуст`,
		example: {
			status: HttpStatus.NOT_FOUND,
			message: 'Категории товаров не найдены',
		},
		},
	}),
  );
}
