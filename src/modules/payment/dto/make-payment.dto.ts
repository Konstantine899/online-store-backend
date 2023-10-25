import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface IMakePaymentDto {
    amount: number;
}

export class MakePaymentDto implements IMakePaymentDto {
    @ApiProperty({ example: 1000 })
    @IsNotEmpty({ message: 'Поле amount не может быть пустым' })
    readonly amount: number;
}
