import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function GetListAllBrandsDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получить список всех брендов` }),
	ApiResponse({
		description: `Get list all brands`,
		status: HttpStatus.OK,
		schema: {
		title: `Список всех брендов`,
		example: [
			{
			id: 4,
			name: 'Bosh',
			},
			{
			id: 2,
			name: 'lg',
			},
			{
			id: 3,
			name: 'samsung',
			},
			{
			id: 1,
			name: 'xiomi',
			},
		],
		},
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Список брендов пуст`,
		example: {
			status: HttpStatus.NOT_FOUND,
			message: `К сожалению по вашему запросу ничего не найдено`,
		},
		},
	}),
  );
}
