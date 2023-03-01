import { IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Наименование продукта должно быть строкой' })
  readonly name: string;

  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2 },
    {
      message: 'Цена продукта должна быть числом c двумя знаками после точки',
    },
  )
  readonly price: number;
}
