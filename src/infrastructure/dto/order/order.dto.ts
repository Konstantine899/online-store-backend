import { OrderItemModel } from '@app/domain/models';
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
import { IOrderDto } from '@app/domain/dto';

export class OrderDto implements IOrderDto {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор заказчика',
    })
    @IsOptional()
    readonly userId?: number;

    @ApiProperty({
        example: 'Атрощенко Константин Анатольевич',
        description: 'ФИО заказчика',
    })
    @IsNotEmpty({ message: 'Укажите ФИО заказчика' })
    @MaxLength(100, { message: 'Поле ФИО не должно превышать 100 символов' })
    readonly name: string;

    @ApiProperty({
        example: 'test@mail.com',
        description: 'Email заказчика',
    })
    @IsNotEmpty({ message: 'Укажите email заказчика' })
    @IsEmail()
    readonly email: string;

    @ApiProperty({
        example: '375298918971',
        description: 'Контактный номер заказчика',
    })
    @IsNotEmpty({ message: 'Укажите контактный номер заказчика' })
    @MaxLength(15, { message: 'Максимальная длинна телефона 15 символов' })
    readonly phone: string;

    @ApiProperty({
        example: 'г. Витебск ул Чкалова 41 к1 кв 73',
        description: 'Адрес доставки',
    })
    @IsNotEmpty({ message: 'Укажите адрес доставки' })
    @MaxLength(200, { message: 'Максимальная длинна 200 символов' })
    readonly address: string;

    @ApiProperty({
        example: 'Комментарий заказчика',
        description: 'Комментарий заказчика',
    })
    @IsOptional()
    @MaxLength(2200, { message: 'Максимальная длинна 2200 символов' })
    readonly comment: string;

    @ApiProperty({
        example: [
            {
                name: 'Xiaomi 10pro',
                price: 1000,
                quantity: 1,
            },
        ],
        description: 'Позиции заказа',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemModel)
    readonly items: OrderItemModel[];
}
