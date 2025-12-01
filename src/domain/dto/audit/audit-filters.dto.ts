import { AuditAction } from '@app/domain/models';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Exclude, Type } from 'class-transformer';

/**
 * DTO для фильтрации audit логов
 */
export class AuditFiltersDto {
    @IsOptional()
    @IsEnum(AuditAction, {
        message: 'Некорректное действие для audit лога',
    })
    action?: AuditAction;

    @IsOptional()
    @IsString()
    entityType?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    entityId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    userId?: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    tenantId?: number;

    @IsOptional()
    @IsString()
    requestId?: string;

    // Эти поля обрабатываются отдельно в контроллере напрямую из request.query
    // Валидируем их как опциональные строки, чтобы они прошли валидацию и не блокировались
    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    // Для export endpoint
    @IsOptional()
    @IsString()
    format?: string;
}
