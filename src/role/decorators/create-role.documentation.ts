import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateRoleDto } from '../dto/create-role.dto';

export function CreateRoleDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание роли пользователя` }),
	ApiBearerAuth('JWT-auth'),
	ApiBody({
		description: `Структура входных данных для создания роли пользователя`,
		type: CreateRoleDto,
	}),
	ApiResponse({
		status: HttpStatus.CREATED,
		schema: {
		title: `Созданная роль пользователя`,
		example: {
			id: 4,
			role: 'MANAGER',
			description: 'Менеджер',
		},
		},
	}),
  );
}
