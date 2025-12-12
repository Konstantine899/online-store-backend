import { NotificationType } from '@app/domain/models';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator';

export class TemplateFiltersDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Номер страницы',
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Номер страницы должен быть целым числом' })
    @Min(1, { message: 'Номер страницы должен быть >= 1' })
    declare readonly page?: number;

    @ApiPropertyOptional({
        example: 20,
        description: 'Количество элементов на странице',
        minimum: 1,
        maximum: 100,
        default: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Лимит должен быть целым числом' })
    @Min(1, { message: 'Лимит должен быть >= 1' })
    @Max(100, { message: 'Лимит не может быть больше 100' })
    declare readonly limit?: number;

    @ApiPropertyOptional({
        example: 'email',
        description: 'Тип шаблона',
        enum: NotificationType,
    })
    @IsOptional()
    @IsEnum(NotificationType, {
        message: 'Некорректный тип шаблона',
    })
    declare readonly type?: NotificationType;

    @ApiPropertyOptional({
        example: true,
        description: 'Показывать только активные шаблоны',
    })
    @IsOptional()
    @IsBoolean({
        message: 'Флаг активности должен быть булевым значением',
    })
    declare readonly isActive?: boolean;
}
