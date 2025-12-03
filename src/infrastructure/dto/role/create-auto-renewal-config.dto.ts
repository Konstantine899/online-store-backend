import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    Min,
} from 'class-validator';

/**
 * DTO для создания конфигурации автоматического продления роли
 *
 * Используется для настройки автоматического продления временной роли
 * при её истечении. Поддерживает настройку длительности продления,
 * максимального количества продлений и включения уведомлений.
 *
 * @example
 * {
 *   "userRoleId": 42,
 *   "renewalDurationMs": 2592000000, // 30 дней
 *   "maxRenewals": 12, // Максимум 12 продлений (1 год)
 *   "notificationEnabled": true
 * }
 */
export class CreateAutoRenewalConfigDto {
    @ApiProperty({
        example: 42,
        description: 'ID назначения роли (user_role_id)',
    })
    @IsNotEmpty({ message: 'Укажите ID назначения роли' })
    @IsInt({ message: 'ID назначения роли должен быть целым числом' })
    @IsPositive({
        message: 'ID назначения роли должен быть положительным',
    })
    @Type(() => Number)
    declare readonly userRoleId: number;

    @ApiProperty({
        example: 2592000000, // 30 дней в миллисекундах
        description:
            'Длительность одного продления в миллисекундах (минимум 86400000 = 1 день)',
    })
    @IsNotEmpty({ message: 'Укажите длительность продления' })
    @IsInt({ message: 'Длительность продления должна быть целым числом' })
    @Min(86400000, {
        message:
            'Длительность продления должна быть не менее 1 дня (86400000 мс)',
    })
    @Type(() => Number)
    declare readonly renewalDurationMs: number;

    @ApiPropertyOptional({
        example: 12,
        description:
            'Максимальное количество продлений (0 = безлимитно). По умолчанию: 12',
        default: 12,
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
        description:
            'Включены ли уведомления о продлении/истечении. По умолчанию: true',
        default: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'notificationEnabled должен быть boolean',
    })
    @Type(() => Boolean)
    declare readonly notificationEnabled?: boolean;
}


