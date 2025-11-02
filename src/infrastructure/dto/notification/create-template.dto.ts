import { NotificationType } from '@app/domain/models';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    Length,
    MaxLength,
} from 'class-validator';

export class CreateTemplateDto {
    @ApiProperty({
        example: 'order_confirmation',
        description: 'Уникальное имя шаблона',
    })
    @IsNotEmpty({ message: 'Имя шаблона обязательно' })
    @IsString({ message: 'Имя шаблона должно быть строкой' })
    @Length(1, 50, {
        message: 'Имя шаблона должно содержать от 1 до 50 символов',
    })
    @IsSanitizedString({
        message: 'Имя шаблона содержит недопустимые символы',
    })
    declare readonly name: string;

    @ApiProperty({
        example: 'email',
        description: 'Тип уведомления',
        enum: NotificationType,
    })
    @IsNotEmpty({ message: 'Тип шаблона обязателен' })
    @IsEnum(NotificationType, {
        message: 'Тип шаблона должен быть email или push',
    })
    declare readonly type: NotificationType;

    @ApiProperty({
        example: 'Заказ подтвержден',
        description: 'Заголовок уведомления',
    })
    @IsNotEmpty({ message: 'Заголовок обязателен' })
    @IsString({ message: 'Заголовок должен быть строкой' })
    @MaxLength(255, {
        message: 'Заголовок не может быть длиннее 255 символов',
    })
    @IsSanitizedString({
        message: 'Заголовок содержит недопустимые символы',
    })
    declare readonly title: string;

    @ApiProperty({
        example: 'Ваш заказ #{{orderNumber}} подтвержден',
        description: 'Текст сообщения уведомления',
    })
    @IsNotEmpty({ message: 'Сообщение обязательно' })
    @IsString({ message: 'Сообщение должно быть строкой' })
    @IsSanitizedString({
        message: 'Сообщение содержит недопустимые символы',
    })
    declare readonly message: string;
}
