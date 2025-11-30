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

/**
 * DTO для фильтрации audit логов
 */
export class AuditFiltersDto {
    @IsOptional()
    @IsEnum(AuditAction)
    action?: AuditAction;

    @IsOptional()
    @IsString()
    entityType?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    entityId?: number;

    @IsOptional()
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
    @IsInt()
    @Min(1)
    tenantId?: number;

    @IsOptional()
    @IsString()
    requestId?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
