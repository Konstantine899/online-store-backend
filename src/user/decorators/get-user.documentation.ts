import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  OmitType,
} from '@nestjs/swagger';
import { UserModel } from '../user.model';

export function GetUserDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение пользователя по идентификатору` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `идентификатор пользователя`,
	}),
	ApiResponse({
		description: `Get user`,
		status: HttpStatus.OK,
		type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
		]),
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Пользователь не найден в БД`,
		example: { statusCode: 404, message: `Пользователь не найден В БД` },
		},
	}),
  );
}
