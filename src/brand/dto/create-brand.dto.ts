import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: `Bosh`, description: `Имя бренда` })
  @IsNotEmpty({ message: 'Поле name не может быть пустым' })
  @IsString({ message: 'Поле name должно быть строкой' })
  readonly name: string;
}
