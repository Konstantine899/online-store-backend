import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IMappingRules } from '@app/domain/models';

/**
 * Response для маппинга ролей
 */
export class RoleMappingResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор маппинга',
    })
    declare id: number;

    @ApiProperty({
        example: 1,
        description: 'ID конфигурации внешней системы',
    })
    declare externalRoleConfigId: number;

    @ApiProperty({
        example: 1,
        description: 'ID тенанта',
    })
    declare tenantId: number;

    @ApiProperty({
        example: 'cn=admins,ou=groups',
        description: 'Название роли/группы во внешней системе',
    })
    declare externalRoleName: string;

    @ApiPropertyOptional({
        example: 'ad-group-12345',
        description: 'ID роли во внешней системе',
    })
    declare externalRoleId: string | null;

    @ApiProperty({
        example: 5,
        description: 'ID роли в нашей системе',
    })
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
        description: 'Правила маппинга',
        type: 'object',
        additionalProperties: false,
    })
    declare mappingRules: IMappingRules | null;

    @ApiProperty({
        example: 100,
        description: 'Приоритет применения (меньше = выше приоритет)',
    })
    declare priority: number;

    @ApiProperty({
        example: true,
        description: 'Активен ли маппинг',
    })
    declare isActive: boolean;

    @ApiProperty({
        example: false,
        description: 'Использовать как default роль',
    })
    declare isDefault: boolean;

    @ApiProperty({
        example: 42,
        description: 'Количество пользователей с этим маппингом',
    })
    declare mappedUsersCount: number;

    @ApiPropertyOptional({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последнего применения маппинга',
    })
    declare lastAppliedAt: Date | null;

    @ApiProperty({
        example: '2025-12-07T10:00:00Z',
        description: 'Дата создания',
    })
    declare createdAt: Date;

    @ApiProperty({
        example: '2025-12-07T12:00:00Z',
        description: 'Дата последнего обновления',
    })
    declare updatedAt: Date;
}

