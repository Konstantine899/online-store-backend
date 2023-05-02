import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiHeaders,
  ApiOperation,
  ApiResponse,
  OmitType,
} from '@nestjs/swagger';
import { UserModel } from '../user.model';

export function GetListUsersDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение списка всех пользователей` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
	ApiResponse({
		description: `Get list users`,
		status: HttpStatus.OK,
		type: [
		OmitType(UserModel, ['roles', 'refresh_tokens', 'products', 'orders']),
		],
	}),
  );
}
