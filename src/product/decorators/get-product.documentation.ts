import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function GetProductDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Получение продукта` }),
	ApiParam({
		name: `id`,
		type: `string`,
		description: `Идентификатор продукта`,
	}),
	ApiResponse({
		status: HttpStatus.OK,
		schema: {
		example: {
			id: 54,
			name: 'Смартфон Xiaomi Redmi Note 12 Pro 4G 8GB/256GB RU (синий)',
			price: 1149,
			rating: 0,
			image: '926429b8-69bf-439b-b9be-6f4893d7bab9.jpg',
			categoryId: 1,
			brandId: 1,
			properties: [
			{
				id: 3,
				name: 'Экран: ',
				value: '6.67  1080x2400 пикселей, AMOLED',
				productId: 54,
			},
			{
				id: 4,
				name: 'Процессор: ',
				value: 'Qualcomm Snapdragon 732G 2.3 ГГц',
				productId: 54,
			},
			{
				id: 5,
				name: 'Память: ',
				value: 'ОЗУ 8 ГБ , 256 ГБ',
				productId: 54,
			},
			{
				id: 6,
				name: 'Формат SIM-карты: ',
				value: 'Nano',
				productId: 54,
			},
			{
				id: 7,
				name: 'Количество мегапикселей камеры: ',
				value: '108 Мп',
				productId: 54,
			},
			{
				id: 8,
				name: 'Емкость аккумулятора: ',
				value: '5000 мА·ч',
				productId: 54,
			},
			],
		},
		},
	}),
	ApiNotFoundResponse({
		status: HttpStatus.NOT_FOUND,
		schema: {
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/product/one/1',
			path: '/online-store/product/one/1',
			name: 'NotFoundException',
			message: 'К сожалению по вашему запросу ничего не найдено',
		},
		},
	}),
  );
}
