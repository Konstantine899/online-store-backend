import { NotificationType } from '@app/domain/models';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    Length,
    MaxLength,
} from 'class-validator';

export class UpdateTemplateDto {
    @ApiPropertyOptional({
        example: 'order_confirmation',
        description: 'Уникальное имя шаблона',
    })
    @IsOptional()
    @IsString({ message: 'Имя шаблона должно быть строкой' })
    @Length(1, 50, {
        message: 'Имя шаблона должно содержать от 1 до 50 символов',
    })
    @IsSanitizedString({
        message: 'Имя шаблона содержит недопустимые символы',
    })
    declare readonly name?: string;

    @ApiPropertyOptional({
        example: 'email',
        description: 'Тип уведомления',
        enum: NotificationType,
    })
    @IsOptional()
    @IsEnum(NotificationType, {
        message: 'Тип шаблона должен быть email или push',
    })
    declare readonly type?: NotificationType;

    @ApiPropertyOptional({
        example: 'Заказ подтвержден',
        description: 'Заголовок уведомления',
    })
    @IsOptional()
    @IsString({ message: 'Заголовок должен быть строкой' })
    @MaxLength(255, {
        message: 'Заголовок не может быть длиннее 255 символов',
    })
    @IsSanitizedString({
        message: 'Заголовок содержит недопустимые символы',
    })
    declare readonly title?: string;

    @ApiPropertyOptional({
        example: 'Ваш заказ #{{orderNumber}} подтвержден',
        description: 'Текст сообщения уведомления',
    })
    @IsOptional()
    @IsString({ message: 'Сообщение должно быть строкой' })
    @IsSanitizedString({
        message: 'Сообщение содержит недопустимые символы',
    })
    declare readonly message?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Активен ли шаблон',
    })
    @IsOptional()
    @IsBoolean({
        message: 'Флаг активности должен быть булевым значением',
    })
    declare readonly isActive?: boolean;
}
