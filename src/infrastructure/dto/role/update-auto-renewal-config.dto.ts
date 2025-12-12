import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsOptional,
    Min,
} from 'class-validator';

/**
 * DTO для обновления конфигурации автоматического продления роли
 *
 * Все поля опциональны - можно обновить только нужные поля.
 * Используется в PATCH endpoint для изменения настроек продления.
 *
 * @example
 * {
 *   "isEnabled": false, // Отключить автоматическое продление
 *   "renewalDurationMs": 5184000000, // Увеличить до 60 дней
 *   "maxRenewals": 6, // Уменьшить лимит до 6 продлений
 *   "notificationEnabled": false // Отключить уведомления
 * }
 */
export class UpdateAutoRenewalConfigDto {
    @ApiPropertyOptional({
        example: true,
        description: 'Включено ли автоматическое продление для этой роли',
    })
    @IsOptional()
    @IsBoolean({
        message: 'isEnabled должен быть boolean',
    })
    @Type(() => Boolean)
    declare readonly isEnabled?: boolean;

    @ApiPropertyOptional({
        example: 2592000000, // 30 дней в миллисекундах
        description:
            'Длительность одного продления в миллисекундах (минимум 86400000 = 1 день)',
    })
    @IsOptional()
    @IsInt({ message: 'Длительность продления должна быть целым числом' })
    @Min(86400000, {
        message:
            'Длительность продления должна быть не менее 1 дня (86400000 мс)',
    })
    @Type(() => Number)
    declare readonly renewalDurationMs?: number;

    @ApiPropertyOptional({
        example: 12,
        description:
            'Максимальное количество продлений (0 = безлимитно)',
    })
    @IsOptional()
    @IsInt({ message: 'Максимальное количество продлений должно быть целым числом' })
    @Min(0, {
        message: 'Максимальное количество продлений не может быть отрицательным',
    })
    @Type(() => Number)
    declare readonly maxRenewals?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Включены ли уведомления о продлении/истечении',
    })
    @IsOptional()
    @IsBoolean({
        message: 'notificationEnabled должен быть boolean',
    })
    @Type(() => Boolean)
    declare readonly notificationEnabled?: boolean;
}


