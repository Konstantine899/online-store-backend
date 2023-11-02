import { Transform } from 'class-transformer';
import { IUserOrderDto } from '../../../domain/dto/order/i-user-order-dto';

export class UserOrderDto implements IUserOrderDto {
    @Transform((value) => Number(value))
    readonly id: number;
}
