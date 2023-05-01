import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRoleDto } from '../dto/create-role.dto';

export function CreateRoleDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание роли пользователя` }),
	ApiBody({
		description: `Структура входных данных для создания роли пользователя`,
		type: CreateRoleDto,
	}),
	ApiResponse({
		status: HttpStatus.CREATED,
		schema: {
		example: {
			id: 4,
			role: 'MANAGER',
			description: 'Менеджер',
		},
		},
	}),
  );
}
