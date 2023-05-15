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
  @MaxLength(100, { message: `Поле ФИО не должно превышать 100 символов` })
  readonly name: string;

  @ApiProperty({ example: `test@mail.com`, description: `Email заказчика` })
  @IsNotEmpty({ message: 'Укажите email заказчика' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({
	example: `375298918971`,
	description: `Контактный номер заказчика`,
  })
  @IsNotEmpty({ message: 'Укажите контактный номер заказчика' })
  @MaxLength(15, { message: `Максимальная длинна телефона 15 символов` })
  readonly phone: string;

  @ApiProperty({
	example: `г. Витебск ул Чкалова 41 к1 кв 73`,
	description: `Адрес доставки`,
  })
  @IsNotEmpty({ message: 'Укажите адрес доставки' })
  @MaxLength(200, { message: `Максимальная длинна 200 символов` })
  readonly address: string;

  @ApiProperty({
	example: `Комментарий заказчика`,
	description: `Комментарий заказчика`,
  })
  @IsOptional()
  @MaxLength(2200, { message: `Максимальная длинна 2200 символов` })
  readonly comment: string;

  @ApiProperty({
	type: OrderItemModel,
	example: [{ name: 'Xiaomi 10pro', price: 1000, quantity: 1 }],
  })
  @IsArray()
  @ValidateNested()
  @Type(() => OrderItemModel)
  readonly items: OrderItemModel[];
}
