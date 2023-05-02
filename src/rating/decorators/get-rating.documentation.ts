import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function GetRatingDocumentation() {
  return applyDecorators(
	ApiOperation({
		summary: `Получение рейтинга продукта`,
		description: `Получать рейтинг товара могут все`,
	}),
	ApiParam({
		name: `productId`,
		type: `string`,
		description: `Идентификатор продукта`,
		required: true,
	}),
	ApiResponse({
		description: `Get rating`,
		status: HttpStatus.OK,
		schema: {
		title: `Все значения относящиеся к rating`,
		example: {
			ratingsSum: 10,
			votes: 2,
			rating: 5,
		},
		},
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Продукт не найден`,
		anyOf: [
			{
			example: {
				statusCode: HttpStatus.NOT_FOUND,
				message: 'Продукт не найден',
			},
			},
		],
		},
	}),
  );
}
