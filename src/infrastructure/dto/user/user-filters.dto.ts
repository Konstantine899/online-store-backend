import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Типы фильтров для пользователей
 */
export enum UserFilterType {
    ACTIVE = 'active',
    BLOCKED = 'blocked',
    VERIFIED = 'verified',
    UNVERIFIED = 'unverified',
    NEWSLETTER = 'newsletter',
}

/**
 * DTO для фильтрации списка пользователей
 * Используется для универсального endpoint'а GET /user/list с query параметрами
 */
export class UserFiltersDto {
    @ApiPropertyOptional({
        description:
            'Тип фильтра для списка пользователей (по умолчанию - все пользователи)',
        enum: UserFilterType,
        example: UserFilterType.ACTIVE,
    })
    @IsOptional()
    @IsEnum(UserFilterType, {
        message:
            'Тип фильтра должен быть одним из: active, blocked, verified, unverified, newsletter',
    })
    declare readonly filterType?: UserFilterType;

    @ApiPropertyOptional({
        description: 'Номер страницы (начиная с 1)',
        minimum: 1,
        default: 1,
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Номер страницы должен быть целым числом' })
    @Min(1, { message: 'Номер страницы должен быть не менее 1' })
    declare readonly page?: number;

    @ApiPropertyOptional({
        description: 'Количество записей на странице (от 1 до 100)',
        minimum: 1,
        maximum: 100,
        default: 5,
        example: 5,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Лимит должен быть целым числом' })
    @Min(1, { message: 'Лимит должен быть не менее 1' })
    @Max(100, { message: 'Лимит не должен превышать 100' })
    declare readonly limit?: number;
}

