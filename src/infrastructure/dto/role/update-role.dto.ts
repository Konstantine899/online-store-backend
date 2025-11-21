import { IUpdateRoleDto } from '@app/domain/dto';
import {
    IsSanitizedString,
    IsValidRoleTenant,
} from '@app/infrastructure/common/validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

/**
 * DTO для обновления существующей роли
 *
 * Все поля опциональны - можно обновить только нужные поля.
 * Используется в PATCH /roles/:id endpoint.
 *
 * @example
 * {
 *   "description": "Обновлённое описание роли",
 *   "level": 55,
 *   "isActive": true
 * }
 */
export class UpdateRoleDto implements IUpdateRoleDto {
    @ApiPropertyOptional({
        example: 'TENANT_MANAGER',
        description: 'Новое название роли (UPPER_SNAKE_CASE)',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Название роли должно быть строкой' })
    @MaxLength(100, {
        message: 'Название роли не может быть длиннее 100 символов',
    })
    @IsSanitizedString({
        message: 'Название роли содержит недопустимые символы',
    })
    declare readonly role?: string;

    @ApiPropertyOptional({
        example: 'Менеджер тенанта с расширенными правами',
        description: 'Новое описание роли (max 200 символов)',
        maxLength: 200,
    })
    @IsOptional()
    @IsString({ message: 'Описание роли должно быть строкой' })
    @MaxLength(200, {
        message: 'Описание роли не может быть длиннее 200 символов',
    })
    @IsSanitizedString({
        message: 'Описание роли содержит недопустимые символы',
    })
    declare readonly description?: string;

    @ApiPropertyOptional({
        example: 55,
        description:
            'Новый уровень иерархии роли (0-100, где 100 - SUPER_ADMIN)',
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @IsInt({ message: 'Уровень должен быть целым числом' })
    @Min(0, { message: 'Уровень не может быть меньше 0' })
    @Max(100, { message: 'Уровень не может быть больше 100' })
    @Type(() => Number)
    declare readonly level?: number;

    @ApiPropertyOptional({
        example: [
            { resource: 'products', action: 'manage' },
            { resource: 'orders', action: 'read' },
        ],
        description:
            'Новые разрешения роли (массив объектов { resource, action, conditions? })',
        type: [Object],
    })
    @IsOptional()
    @IsArray({ message: 'Разрешения должны быть массивом' })
    declare readonly permissions?: unknown[];

    @ApiPropertyOptional({
        example: true,
        description: 'Активна ли роль',
    })
    @IsOptional()
    @IsBoolean({ message: 'isActive должен быть boolean' })
    @Type(() => Boolean)
    declare readonly isActive?: boolean;

    @ApiPropertyOptional({
        example: 1,
        description:
            'ID тенанта (NULL для системных ролей, обязательно для tenant-specific ролей)',
    })
    @IsOptional()
    @IsInt({ message: 'tenantId должен быть целым числом' })
    @IsPositive({ message: 'tenantId должен быть положительным числом' })
    @Type(() => Number)
    @IsValidRoleTenant()
    declare readonly tenantId?: number | null;
}
