import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function GetRoleDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение роли` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `Роль`,
		description: `Роль`,
		type: `string`,
		example: `MANAGER`,
		required: true,
	}),
	ApiResponse({
		status: HttpStatus.OK,
		schema: {
		title: `Полученная роль`,
		example: {
			id: 5,
			role: 'MANAGER',
			description: 'Менеджер',
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Роль не найдена`,
		example: {
			status: HttpStatus.NOT_FOUND,
			message: 'Роль MANAGER не найдена',
		},
		},
	}),
  );
}
