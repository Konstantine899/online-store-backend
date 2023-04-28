import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RemoveRoleDto } from '../dto/remove-role.dto';

export function RemoveRoleUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Удаление роли у пользователя` }),
	ApiBody({
		description: `Входные данные для удаления пользователя`,
		type: RemoveRoleDto,
	}),
	ApiResponse({
		description: `Remove Role`,
		status: HttpStatus.OK,
		schema: { title: `Количество удаленных записей из БД`, example: 1 },
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		anyOf: [
			{
			title: 'Поиск не существующего пользователя',
			description: `Пользователь не найден в БД`,
			example: {
				statusCode: 404,
				message: 'Пользователь не найден в БД',
			},
			},
			{
			title: `Удаление роли которой нет у пользователя`,
			description: `Удаление роли пользователя которая ему не принадлежит`,
			example: {
				statusCode: 404,
				message: `Роль ADMIN не принадлежит данному пользователю`,
			},
			},
		],
		},
	}),
	ApiForbiddenResponse({
		description: `Forbidden`,
		status: HttpStatus.FORBIDDEN,
		schema: {
		title: `Запрет удаления роли USER`,
		example: {
			status: 403,
			message: 'Удаление роли USER запрещено',
		},
		},
	}),
  );
}
