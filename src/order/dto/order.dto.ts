import { OrderItemModel } from '../../order-item/order-item.model';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderDto {
  /*userId буду получать из access token нужно отрефакторить*/
  readonly userId: number;
  @IsNotEmpty({ message: 'Укажите ФИО заказчика' })
  @MaxLength(100)
  readonly name: string;

  @IsNotEmpty({ message: 'Укажите email заказчика' })
  @IsEmail()
  readonly email: string;

  @IsNotEmpty({ message: 'Укажите контактный номер заказчика' })
  @MaxLength(15)
  readonly phone: string;
  @IsNotEmpty({ message: 'Укажите адрес заказчика' })
  @MaxLength(200)
  readonly address: string;

  @IsOptional()
  @MaxLength(2200)
  readonly comment: string;

  @IsArray()
  @ValidateNested()
  @Type(() => OrderItemModel)
  readonly items: OrderItemModel[];
}
