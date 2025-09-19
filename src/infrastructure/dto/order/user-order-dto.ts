import { Transform } from 'class-transformer';
import { IUserOrderDto } from '@app/domain/dto';

export class UserOrderDto implements IUserOrderDto {
    @Transform((value) => Number(value))
    declare readonly id: number;
}
