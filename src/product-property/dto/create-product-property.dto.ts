import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductPropertyDto {
  @IsNotEmpty({ message: 'Имя свойства не должно быть пустым' })
  @IsString({ message: 'Имя свойства  должно быть строкой' })
  readonly name: string;

  @IsNotEmpty({ message: 'Значение свойства не должно быть пустым' })
  @IsString({ message: 'Значение свойства  должно быть строкой' })
  readonly value: string;
}
