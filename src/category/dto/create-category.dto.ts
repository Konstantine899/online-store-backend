import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: `Смартфоны` })
  @IsNotEmpty({ message: 'Поле name не может быть пустым' })
  @IsString({ message: 'Поле name должна быть строкой' })
  readonly name: string;
}
