import { CategoryModel } from '../category-model';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponse extends CategoryModel {
  @ApiProperty({ example: 1, description: `Идентификатор категории` })
  readonly id: number;
  @ApiProperty({ example: 'Смартфоны', description: `Имя категории` })
  readonly name: string;
}
