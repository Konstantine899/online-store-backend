import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

export function CreateBrandDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Создание бренда продукта` }),
	ApiBearerAuth('JWT-auth'),
	ApiBody({
		type: CreateBrandDto,
		description: `Структура входящих данных для создания бренда`,
	}),
	ApiResponse({
		description: `Created brand`,
		status: HttpStatus.CREATED,
		schema: {
		title: `Тело ответа созданного бренда`,
		example: {
			id: 4,
			name: 'Bosh',
			updatedAt: '2023-05-11T08:42:14.588Z',
			createdAt: '2023-05-11T08:42:14.588Z',
		},
		},
	}),
	ApiBadRequestResponse({
		description: `Bad Request`,
		status: HttpStatus.BAD_REQUEST,
		schema: {
		title: `Валидация`,
		anyOf: [
			{
			title: `Поле name не может быть пустым`,
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: ['Поле name не может быть пустым'],
				value: '',
			},
			},
			{
			title: `Поле name должно быть строкой`,
			example: {
				status: HttpStatus.BAD_REQUEST,
				property: 'name',
				messages: ['Поле name должно быть строкой'],
				value: 1,
			},
			},
		],
		},
	}),
  );
}
