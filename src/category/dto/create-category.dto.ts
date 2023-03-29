import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Поле котегория не может быть пустым' })
  @IsString({ message: 'Поле котегория должна быть строкой' })
  readonly name: string;
}
