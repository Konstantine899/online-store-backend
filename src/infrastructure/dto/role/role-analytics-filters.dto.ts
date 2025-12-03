import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

/**
 * DTO для фильтрации аналитики ролей
 * Используется для query параметров в analytics endpoints
 */
export class RoleAnalyticsFiltersDto {
    @ApiPropertyOptional({
        example: '2024-01-01T00:00:00Z',
        description: 'Начальная дата периода (ISO 8601)',
    })
    @IsOptional()
    @IsDateString(
        {},
        {
            message: 'Начальная дата должна быть в формате ISO 8601',
        },
    )
    declare readonly startDate?: string;

    @ApiPropertyOptional({
        example: '2024-12-31T23:59:59Z',
        description: 'Конечная дата периода (ISO 8601)',
    })
    @IsOptional()
    @IsDateString(
        {},
        {
            message: 'Конечная дата должна быть в формате ISO 8601',
        },
    )
    declare readonly endDate?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID тенанта (только для SUPER_ADMIN)',
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'ID тенанта должен быть целым числом' })
    @Min(1, { message: 'ID тенанта должен быть >= 1' })
    declare readonly tenantId?: number;

    @ApiPropertyOptional({
        example: 'last24h',
        description:
            'Период для дашборда: last24h, last7d, last30d, custom (требует startDate и endDate)',
        enum: ['last24h', 'last7d', 'last30d', 'custom'],
    })
    @IsOptional()
    @IsString({ message: 'Период должен быть строкой' })
    declare readonly period?: 'last24h' | 'last7d' | 'last30d' | 'custom';
}
