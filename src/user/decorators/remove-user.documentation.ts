import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function RemoveUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Удаление пользователя` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `идентификатор пользователя`,
	}),
	ApiResponse({
		description: `Remove user`,
		status: HttpStatus.OK,
		schema: { title: 'Удалено записей', example: 1 },
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Пользователь не найден В БД`,
		example: {
			title: `Пользователь не найден В БД`,
			statusCode: 404,
			message: 'Пользователь не найден В БД',
		},
		},
	}),
  );
}
