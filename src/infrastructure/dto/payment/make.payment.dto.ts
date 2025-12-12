import { IMakePaymentDto } from '@app/domain/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class MakePaymentDto implements IMakePaymentDto {
    @ApiProperty({ example: 1000 })
    @IsNotEmpty({ message: 'Поле amount не может быть пустым' })
    declare readonly amount: number;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsNumber()
    declare readonly orderId?: number;
}
