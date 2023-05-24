import { ApiProperty } from '@nestjs/swagger';

export class MetaData {
  @ApiProperty({ example: 7, description: `Общее количество продуктов` })
  totalCount: number;

  @ApiProperty({ example: 7, description: `Общее количество страниц` })
  lastPage: number;

  @ApiProperty({ example: 1, description: `Текущая страница` })
  currentPage: number;

  @ApiProperty({ example: 2, description: `Следующая страница` })
  nextPage: number;

  @ApiProperty({ example: 0, description: `Предыдущая страница` })
  previousPage: number;
}
