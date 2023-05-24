import { CategoryModel } from '../category-model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryResponse extends CategoryModel {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: 'Смартфоны' })
  readonly name: string;

  @ApiProperty({ example: '2023-05-11T12:24:33.702Z', required: false })
  readonly updatedAt?: string;
  @ApiProperty({ example: '2023-05-11T12:24:33.702Z', required: false })
  readonly createdAt?: string;
}
