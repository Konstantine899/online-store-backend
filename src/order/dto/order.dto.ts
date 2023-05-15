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
import { ApiProperty } from '@nestjs/swagger';

export class OrderDto {
  @ApiProperty({ example: 1, description: `Идентификатор заказчика` })
  readonly userId: number;

  @ApiProperty({
	example: `Атрощенко константин Анатольевич`,
	description: `ФИО заказчика`,
  })
  @IsNotEmpty({ message: 'Укажите ФИО заказчика' })
  @MaxLength(100)
  readonly name: string;

  @ApiProperty({ example: `test@mail.com`, description: `Email заказчика` })
  @IsNotEmpty({ message: 'Укажите email заказчика' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({
	example: `+375(29)891-89-71`,
	description: `Контактный номер заказчика`,
  })
  @IsNotEmpty({ message: 'Укажите контактный номер заказчика' })
  @MaxLength(15)
  readonly phone: string;
  @IsNotEmpty({ message: 'Укажите адрес заказчика' })
  @MaxLength(200)
  readonly address: string;

  @ApiProperty({
	example: `Комментарий заказчика`,
	description: `Комментарий заказчика`,
  })
  @IsOptional()
  @MaxLength(2200)
  readonly comment: string;

  @ApiProperty({ type: OrderItemModel })
  @IsArray()
  @ValidateNested()
  @Type(() => OrderItemModel)
  readonly items: OrderItemModel[];
}
