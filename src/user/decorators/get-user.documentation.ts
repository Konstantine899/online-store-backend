import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiHeaders,
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
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
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
