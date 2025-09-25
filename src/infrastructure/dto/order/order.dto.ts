import { OrderItemModel } from '@app/domain/models';
import {
    IsArray,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    MaxLength,
    ValidateNested,
    IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IOrderDto } from '@app/domain/dto';
import {
    IsSanitizedString,
    IsValidPhone,
    IsValidName,
} from '@app/infrastructure/common/validators';

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
    @IsString({ message: 'ФИО должно быть строкой' })
    @IsValidName({ message: 'ФИО содержит недопустимые символы' })
    @MaxLength(100, { message: 'Поле ФИО не должно превышать 100 символов' })
    declare readonly name: string;

    @ApiProperty({
        example: 'test@mail.com',
        description: 'Email заказчика',
    })
    @IsNotEmpty({ message: 'Укажите email заказчика' })
    @IsString({ message: 'Email должен быть строкой' })
    @IsEmail({}, { message: 'Неверный формат email' })
    @IsSanitizedString({ message: 'Email содержит недопустимые символы' })
    declare readonly email: string;

    @ApiProperty({
        example: '375298918971',
        description: 'Контактный номер заказчика',
    })
    @IsNotEmpty({ message: 'Укажите контактный номер заказчика' })
    @IsString({ message: 'Телефон должен быть строкой' })
    @IsValidPhone({ message: 'Неверный формат номера телефона' })
    @MaxLength(15, { message: 'Максимальная длинна телефона 15 символов' })
    declare readonly phone: string;

    @ApiProperty({
        example: 'г. Витебск ул Чкалова 41 к1 кв 73',
        description: 'Адрес доставки',
    })
    @IsNotEmpty({ message: 'Укажите адрес доставки' })
    @IsString({ message: 'Адрес должен быть строкой' })
    @IsSanitizedString({ message: 'Адрес содержит недопустимые символы' })
    @MaxLength(200, { message: 'Максимальная длинна 200 символов' })
    declare readonly address: string;

    @ApiProperty({
        example: 'Комментарий заказчика',
        description: 'Комментарий заказчика',
    })
    @IsOptional()
    @IsString({ message: 'Комментарий должен быть строкой' })
    @IsSanitizedString({ message: 'Комментарий содержит недопустимые символы' })
    @MaxLength(2200, { message: 'Максимальная длинна 2200 символов' })
    declare readonly comment: string;

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
    declare readonly items: OrderItemModel[];
}
