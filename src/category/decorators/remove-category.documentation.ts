import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function RemoveCategoryDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Удаление категории` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `Идентификатор категории`,
		required: true,
	}),
	ApiResponse({
		description: `Remove category`,
		status: HttpStatus.OK,
		schema: { title: 'Удалено записей', example: 1 },
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Категория не найдена`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/category/delete/111',
			path: '/online-store/category/delete/111',
			name: 'NotFoundException',
			message: 'Категория товара не найдена',
		},
		},
	}),
  );
}
