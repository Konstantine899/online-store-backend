import { CategoryModel } from '../category-model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryResponse extends CategoryModel {
  @ApiProperty({ example: 1, description: `Идентификатор категории` })
  readonly id: number;
  @ApiProperty({ example: 'Смартфоны', description: `Имя категории` })
  readonly name: string;

  @ApiProperty({
	example: '2023-05-11T12:24:33.702Z',
	required: false,
	description: `Время обновления`,
  })
  readonly updatedAt?: string;
  @ApiProperty({
	example: '2023-05-11T12:24:33.702Z',
	required: false,
	description: `Время создания`,
  })
  readonly createdAt?: string;
}
