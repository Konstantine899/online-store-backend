import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function RemoveBrandDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Удаление бренда` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `Идентификатор бренда`,
		required: true,
	}),
	ApiResponse({
		description: `Remove brand`,
		status: HttpStatus.OK,
		schema: { title: 'Удалено записей', example: 1 },
	}),
	ApiNotFoundResponse({
		description: `Not found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Бренд не найден`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/brand/one/11',
			path: '/online-store/brand/one/11',
			name: 'NotFoundException',
			message: 'Бренд не найден',
		},
		},
	}),
  );
}
