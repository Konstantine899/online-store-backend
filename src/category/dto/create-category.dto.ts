import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Поле категория не может быть пустым' })
  @IsString({ message: 'Поле категория должна быть строкой' })
  readonly name: string;
}
