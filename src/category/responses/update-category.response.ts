import { CategoryModel } from '../category-model';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryResponse extends CategoryModel {
  @ApiProperty({ example: 1 })
  readonly id: number;

  @ApiProperty({ example: `Смартфоны` })
  readonly name: string;

  @ApiProperty({ example: `2023-05-11T13:23:32.511Z` })
  readonly updatedAt?: string;
}
