import {
    IsNotEmpty,
    IsString,
    MaxLength,
    IsInt,
    Min,
    Max,
    IsBoolean,
    IsOptional,
    IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateRoleDto } from '@app/domain/dto';
import {
    IsSanitizedString,
    IsValidRoleTenant,
} from '@app/infrastructure/common/validators';
import { Type } from 'class-transformer';

export class CreateRoleDto implements ICreateRoleDto {
    @ApiProperty({
        example: 'TENANT_MANAGER',
        description: 'Название роли (UPPER_SNAKE_CASE)',
    })
    @IsNotEmpty({ message: 'Укажите название роли' })
    @IsString({ message: 'Название роли должно быть строкой' })
    @MaxLength(100, {
        message: 'Название роли не может быть длиннее 100 символов',
    })
    @IsSanitizedString({
        message: 'Название роли содержит недопустимые символы',
    })
    declare readonly role: string;

    @ApiProperty({
        example: 'Менеджер тенанта',
        description: 'Описание роли (max 200 символов)',
    })
    @IsNotEmpty({ message: 'Укажите описание роли' })
    @IsString({ message: 'Описание роли должно быть строкой' })
    @MaxLength(200, {
        message: 'Описание роли не может быть длиннее 200 символов',
    })
    @IsSanitizedString({
        message: 'Описание роли содержит недопустимые символы',
    })
    declare readonly description: string;

    @ApiPropertyOptional({
        example: 50,
        description:
            'Уровень иерархии роли (0-100, где 100 - SUPER_ADMIN). Default: 0',
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
        example: [],
        description: 'Массив разрешений роли',
        type: [Object],
    })
    @IsOptional()
    @IsArray({ message: 'Разрешения должны быть массивом' })
    declare readonly permissions?: unknown[];

    @ApiProperty({
        example: false,
        description:
            'Системная роль (true) или tenant-specific роль (false). Default: false',
    })
    @IsBoolean({ message: 'is_system_role должен быть boolean' })
    @Type(() => Boolean)
    declare readonly isSystemRole: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Активна ли роль. Default: true',
    })
    @IsOptional()
    @IsBoolean({ message: 'is_active должен быть boolean' })
    @Type(() => Boolean)
    declare readonly isActive?: boolean;

    @ApiPropertyOptional({
        example: 1,
        description:
            'ID тенанта (обязательно для tenant-specific ролей, NULL для системных ролей)',
    })
    @IsOptional()
    @IsInt({ message: 'tenant_id должен быть целым числом' })
    @Type(() => Number)
    @IsValidRoleTenant()
    declare readonly tenantId?: number | null;
}
