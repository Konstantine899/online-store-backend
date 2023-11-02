import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IMakePaymentDto } from '../../../domain/dto/payment/i-make-payment-dto';

export class MakePaymentDto implements IMakePaymentDto {
    @ApiProperty({ example: 1000 })
    @IsNotEmpty({ message: 'Поле amount не может быть пустым' })
    readonly amount: number;
}
