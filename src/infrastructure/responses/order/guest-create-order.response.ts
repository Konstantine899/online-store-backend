import { OrderModel, OrderItemModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GuestCreateOrderResponse extends OrderModel {
    @ApiProperty({ example: 1, description: 'Идентификатор заказа' })
    declare readonly id: number;

    @ApiProperty({ example: 'Константин', description: 'Имя заказчика' })
    declare readonly name: string;

    @ApiProperty({
        example: '375298918971@gmail.com',
        description: 'email адрес заказчика',
    })
    declare readonly email: string;

    @ApiProperty({
        example: '375298918971',
        description: 'Контактный номер заказчика',
    })
    declare readonly phone: string;

    @ApiProperty({
        example: 'г. Витебск ул Чкалова 41 к1 кв 73',
        description: 'Адрес доставки',
    })
    declare readonly address: string;

    @ApiProperty({ example: 1000, description: 'Сумма заказа' })
    declare readonly amount: number;

    @ApiProperty({ example: 0, description: 'Статус заказа' })
    declare readonly status: number;

    @ApiProperty({
        example: 'Лучший заказ',
        description: 'Комментарий заказчика',
    })
    declare readonly comment: string;

    @ApiProperty({ example: 1, description: 'Идентификатор заказчика' })
     declare readonly user_id: number;

    @ApiProperty({ type: () => [OrderItemModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemModel)
    declare readonly items: OrderItemModel[];
}
