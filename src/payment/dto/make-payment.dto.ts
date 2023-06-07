import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MakePaymentDto {
  @ApiProperty({ example: 1000 })
  @IsNotEmpty({ message: `Поле amount не может быть пустым` })
  readonly amount: number;
}
