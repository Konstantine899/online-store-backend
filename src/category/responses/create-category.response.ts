import { CategoryModel } from '../category-model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryResponse extends CategoryModel {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'Ноутбуки' })
  name: string;

  @ApiProperty({ example: '2023-05-11T12:24:33.702Z', required: false })
  updatedAt?: string;
  @ApiProperty({ example: '2023-05-11T12:24:33.702Z', required: false })
  createdAt?: string;
}
