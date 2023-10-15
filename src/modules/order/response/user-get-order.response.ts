import { OrderModel } from '../order.model';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemModel } from '../../order-item/order-item.model';

export class UserGetOrderResponse extends OrderModel {
    @ApiProperty({ example: 1, description: 'Идентификатор заказа' })
    readonly id: number;

    @ApiProperty({ example: 'Константин', description: 'Имя заказчика' })
    readonly name: string;

    @ApiProperty({
        example: '375298918971@gmail.com',
        description: 'email адрес заказчика',
    })
    readonly email: string;

    @ApiProperty({
        example: '375298918971',
        description: 'Контактный номер заказчика',
    })
    readonly phone: string;

    @ApiProperty({
        example: 'г. Витебск ул Чкалова 41 к1 кв 73',
        description: 'Адрес доставки',
    })
    readonly address: string;

    @ApiProperty({ example: 1000, description: 'Сумма заказа' })
    readonly amount: number;

    @ApiProperty({ example: 0, description: 'Статус заказа' })
    readonly status: number;

    @ApiProperty({
        example: 'Лучший заказ',
        description: 'Комментарий заказчика',
    })
    readonly comment: string | null;

    @ApiProperty({ example: 1, description: 'Идентификатор заказчика' })
    readonly userId: number;

    @ApiProperty({ type: () => [OrderItemModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemModel)
    readonly items: OrderItemModel[];
}
