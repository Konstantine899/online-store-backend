import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiHeaders,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateRoleDto } from '../dto/create-role.dto';

export function CreateRoleDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание роли пользователя` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
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
