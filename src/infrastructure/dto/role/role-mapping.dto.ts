import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { IMappingRules } from '@app/domain/models';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

/**
 * DTO для правила маппинга (условие)
 */
export class MappingRuleConditionDto {
    @ApiProperty({
        example: { department: 'IT', external_role: 'admin' },
        description: 'Условие (if)',
        type: 'object',
    })
    @IsNotEmpty({ message: 'Укажите условие' })
    @IsObject({ message: 'Условие должно быть объектом' })
    declare if: Record<string, unknown>;

    @ApiProperty({
        example: 5,
        description: 'Результат (then) - ID внутренней роли или название роли',
    })
    @IsNotEmpty({ message: 'Укажите результат' })
    declare then: string | number;
}

/**
 * DTO для правил маппинга
 */
export class MappingRulesDto implements IMappingRules {
    @ApiPropertyOptional({
        example: [
            {
                if: { department: 'IT', external_role: 'admin' },
                then: 'TENANT_ADMIN',
            },
        ],
        description: 'Условия маппинга',
        type: [MappingRuleConditionDto],
    })
    @IsOptional()
    @IsArray({ message: 'Условия должны быть массивом' })
    @ValidateNested({ each: true })
    @Type(() => MappingRuleConditionDto)
    declare conditions?: Array<{
        if: Record<string, unknown>;
        then: string | number;
    }>;

    @ApiPropertyOptional({
        example: 'USER',
        description: 'Default роль (если нет совпадений)',
    })
    @IsOptional()
    declare default?: string | number;

    [key: string]: unknown;
}

/**
 * DTO для создания маппинга ролей
 */
export class CreateRoleMappingDto {
    @ApiProperty({
        example: 'cn=admins,ou=groups',
        description: 'Название роли/группы во внешней системе',
    })
    @IsNotEmpty({ message: 'Укажите название внешней роли' })
    @IsString({ message: 'Название должно быть строкой' })
    @MinLength(1, {
        message: 'Название должно содержать минимум 1 символ',
    })
    @MaxLength(255, {
        message: 'Название не может быть длиннее 255 символов',
    })
    @IsSanitizedString({
        message: 'Название содержит недопустимые символы',
    })
    declare externalRoleName: string;

    @ApiPropertyOptional({
        example: 'ad-group-12345',
        description: 'ID роли во внешней системе (если доступен)',
    })
    @IsOptional()
    @IsString({ message: 'ID должен быть строкой' })
    @MaxLength(255, {
        message: 'ID не может быть длиннее 255 символов',
    })
    declare externalRoleId?: string;

    @ApiProperty({
        example: 5,
        description: 'ID роли в нашей системе',
    })
    @IsNotEmpty({ message: 'Укажите ID внутренней роли' })
    @IsInt({ message: 'ID роли должен быть целым числом' })
    @Min(1, { message: 'ID роли должен быть положительным' })
    @Type(() => Number)
    declare internalRoleId: number;

    @ApiPropertyOptional({
        example: {
            conditions: [
                {
                    if: { department: 'IT', external_role: 'admin' },
                    then: 'TENANT_ADMIN',
                },
            ],
            default: 'USER',
        },
        description: 'Правила маппинга (условия, фильтры)',
        type: MappingRulesDto,
    })
    @IsOptional()
    @IsObject({ message: 'Правила должны быть объектом' })
    @ValidateNested()
    @Type(() => MappingRulesDto)
    declare mappingRules?: MappingRulesDto;

    @ApiPropertyOptional({
        example: 100,
        description: 'Приоритет применения (меньше = выше приоритет)',
        default: 100,
        minimum: 0,
        maximum: 1000,
    })
    @IsOptional()
    @IsInt({ message: 'Приоритет должен быть целым числом' })
    @Min(0, { message: 'Приоритет не может быть меньше 0' })
    @Max(1000, { message: 'Приоритет не может быть больше 1000' })
    @Type(() => Number)
    declare priority?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Активен ли маппинг',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_active должен быть boolean' })
    @Type(() => Boolean)
    declare isActive?: boolean;

    @ApiPropertyOptional({
        example: false,
        description: 'Использовать как default роль, если нет других совпадений',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_default должен быть boolean' })
    @Type(() => Boolean)
    declare isDefault?: boolean;
}

/**
 * DTO для обновления маппинга ролей
 */
export class UpdateRoleMappingDto {
    @ApiPropertyOptional({
        example: 'cn=admins,ou=groups',
        description: 'Название роли/группы во внешней системе',
    })
    @IsOptional()
    @IsString({ message: 'Название должно быть строкой' })
    @MinLength(1, {
        message: 'Название должно содержать минимум 1 символ',
    })
    @MaxLength(255, {
        message: 'Название не может быть длиннее 255 символов',
    })
    @IsSanitizedString({
        message: 'Название содержит недопустимые символы',
    })
    declare externalRoleName?: string;

    @ApiPropertyOptional({
        example: 'ad-group-12345',
        description: 'ID роли во внешней системе',
    })
    @IsOptional()
    @IsString({ message: 'ID должен быть строкой' })
    @MaxLength(255, {
        message: 'ID не может быть длиннее 255 символов',
    })
    declare externalRoleId?: string;

    @ApiPropertyOptional({
        example: 5,
        description: 'ID роли в нашей системе',
    })
    @IsOptional()
    @IsInt({ message: 'ID роли должен быть целым числом' })
    @Min(1, { message: 'ID роли должен быть положительным' })
    @Type(() => Number)
    declare internalRoleId?: number;

    @ApiPropertyOptional({
        example: {
            conditions: [
                {
                    if: { department: 'IT', external_role: 'admin' },
                    then: 'TENANT_ADMIN',
                },
            ],
            default: 'USER',
        },
        description: 'Правила маппинга',
        type: MappingRulesDto,
    })
    @IsOptional()
    @IsObject({ message: 'Правила должны быть объектом' })
    @ValidateNested()
    @Type(() => MappingRulesDto)
    declare mappingRules?: MappingRulesDto;

    @ApiPropertyOptional({
        example: 50,
        description: 'Приоритет применения',
        minimum: 0,
        maximum: 1000,
    })
    @IsOptional()
    @IsInt({ message: 'Приоритет должен быть целым числом' })
    @Min(0, { message: 'Приоритет не может быть меньше 0' })
    @Max(1000, { message: 'Приоритет не может быть больше 1000' })
    @Type(() => Number)
    declare priority?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Активен ли маппинг',
    })
    @IsOptional()
    @IsBoolean({ message: 'is_active должен быть boolean' })
    @Type(() => Boolean)
    declare isActive?: boolean;

    @ApiPropertyOptional({
        example: false,
        description: 'Использовать как default роль',
    })
    @IsOptional()
    @IsBoolean({ message: 'is_default должен быть boolean' })
    @Type(() => Boolean)
    declare isDefault?: boolean;
}

