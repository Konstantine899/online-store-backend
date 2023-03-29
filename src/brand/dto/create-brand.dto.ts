import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBrandDto {
  @IsNotEmpty({ message: 'Поле бренд не может быть пустым' })
  @IsString({ message: 'Поле бренд должно быть строкой' })
  readonly name: string;
}
