import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  @IsString({ message: 'Имя  должно быть строкой' })
  readonly name: string;

  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2 },
    {
      message: 'Цена продукта должна быть числом c двумя знаками после точки',
    },
  )
  @Transform(({ value }): number => Number.parseFloat(value))
  readonly price: number;
}
