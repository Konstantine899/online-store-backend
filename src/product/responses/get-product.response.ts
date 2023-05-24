import { ProductModel } from '../product.model';
import { ProductPropertyModel } from '../../product-property/product-property.model';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductResponse extends ProductModel {
  @ApiProperty({ example: 54, description: `Идентификатор продукта` })
  id: number;

  @ApiProperty({
	example: `Смартфон Xiaomi Redmi Note 12 Pro 4G 8GB/256GB RU (синий)`,
	description: `Имя продукта`,
  })
  name: string;

  @ApiProperty({ example: 1000, description: `Цена продукта` })
  'price': number;

  @ApiProperty({ example: 5, description: `Рейтинг продукта` })
  'rating': number;

  @ApiProperty({
	example: `926429b8-69bf-439b-b9be-6f4893d7bab9.jpg`,
	description: `Имя и расширение изображения продукта`,
  })
  'image': string;

  @ApiProperty({ example: 1, description: `Идентификатор категории` })
  'categoryId': number;

  @ApiProperty({ example: 1, description: `Идентификатор бренда` })
  'brandId': number;

  @ApiProperty({
	example: [
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
	description: `Характеристики продукта`,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPropertyModel)
  properties: ProductPropertyModel[];
}
