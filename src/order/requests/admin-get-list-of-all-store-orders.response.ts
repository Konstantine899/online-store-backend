import { OrderModel } from '../order.model';
import { ApiProperty } from '@nestjs/swagger';

export class AdminGetListOfAllStoreOrdersResponse extends OrderModel {
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
}
