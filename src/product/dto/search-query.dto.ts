import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({
	example: `Xiaomi Redmi Note 10 Pro`,
	description: `Поиск производится по имени продукта`,
  })
  @IsOptional()
  readonly search: string;
}
