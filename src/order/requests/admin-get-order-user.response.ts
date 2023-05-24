import { OrderModel } from '../order.model';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItemModel } from '../../order-item/order-item.model';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminGetOrderUserResponse extends OrderModel {
  @ApiProperty({ example: 1 })
  readonly id: number;

  @ApiProperty({ example: 'Константин' })
  readonly name: string;

  @ApiProperty({ example: '375298918971@gmail.com' })
  readonly email: string;

  @ApiProperty({ example: '375298918971' })
  readonly phone: string;

  @ApiProperty({ example: 'г. Витебск ул Чкалова 41 к1 кв 73' })
  readonly address: string;

  @ApiProperty({ example: 6000 })
  readonly amount: number;

  @ApiProperty({ example: 0 })
  readonly status: number;

  @ApiProperty({ example: null })
  readonly comment: string | null;

  @ApiProperty({ example: 1 })
  readonly userId: number;

  @ApiProperty({
	example: [
		{
		name: 'Xiaomi 10pro',
		price: 1000,
		quantity: 1,
		},
	],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemModel)
  readonly items: OrderItemModel[];
}
