import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UserRequest } from '../requests/user.request';

export function CreateRatingDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание рейтинга` }),
	ApiHeaders([
		{
		name: `Authorization`,
		description:
			'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlt7ImlkIjoxLCJyb2xlIjoiQURNSU4iLCJkZXNjcmlwdGlvbiI6ItCQ0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGAIn0seyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjgzMDA4MDg0LCJleHAiOjE2ODMwOTQ0ODQsInN1YiI6IjEifQ.u0CmxeLT6CEUg4Yx38FwBDZwQ5QUXABK5306OrEMNt0',
		required: true,
		},
	]),
	ApiParam({
		name: `productId`,
		type: `string`,
		description: `Идентификатор продукта`,
		required: true,
	}),
	ApiParam({
		name: `rating`,
		type: `string`,
		description: `Рейтинг продукта`,
		required: true,
	}),
	ApiBody({
		type: UserRequest,
		description: `Это описание тела запроса в котором содержится пользователь т.е. request.user`,
		required: true,
	}),
	ApiResponse({
		description: `Created rating`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Созданный рейтинг продукта`,
		example: { userId: 1, productId: 1, rating: 5 },
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Не найдено`,
		anyOf: [
			{
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				message: 'Продукт не найден',
			},
			},
			{
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				message: 'Пользователь не найден',
			},
			},
		],
		},
	}),
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		title: `Оценка рейтинга ставится повторно`,
		description: `В клиентской части блокируй возможность ставить повторно рейтинг продукта`,
		example: {
			status: HttpStatus.BAD_REQUEST,
			message: 'Оценка рейтинга выми была выставлена ранее',
		},
		},
	}),
  );
}
