import { ProductModel } from '../../product.model';
import { ApiProperty } from '@nestjs/swagger';

export class Rows extends ProductModel {
  @ApiProperty({ example: 1, description: `Идентификатор продукта` })
  id: number;

  @ApiProperty({ example: `Xiaomi Redmi 10 pro`, description: `Имя продукта` })
  name: string;

  @ApiProperty({ example: 1000, description: `Цена продукта` })
  price: number;

  @ApiProperty({ example: 5, description: `Рейтинг продукта` })
  rating: number;
  @ApiProperty({
	example: `471d35be-9906-4cee-a681-76a53a19bd25.png`,
	description: `Имя и расширение картинки`,
  })
  image: string;

  @ApiProperty({ example: 1, description: `Идентификатор категории` })
  categoryId: number;

  @ApiProperty({ example: 1, description: `Идентификатор бренда` })
  brandId: number;
}