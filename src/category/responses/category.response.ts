import { CategoryModel } from '../category-model';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponse extends CategoryModel {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: 'Смартфоны' })
  readonly name: string;
}
