import { ApiProperty } from '@nestjs/swagger';

/**
 * Информация об одной роли пользователя
 */
export class UserRoleInfo {
    @ApiProperty({
        description: 'ID записи user_role',
        example: 42,
    })
    declare readonly id: number;

    @ApiProperty({
        description: 'ID роли',
        example: 5,
    })
    declare readonly roleId: number;

    @ApiProperty({
        description: 'Название роли',
        example: 'MANAGER',
    })
    declare readonly roleName: string;

    @ApiProperty({
        description: 'Описание роли',
        example: 'Менеджер магазина',
    })
    declare readonly roleDescription: string;

    @ApiProperty({
        description: 'Уровень роли в иерархии',
        example: 50,
    })
    declare readonly roleLevel: number;

    @ApiProperty({
        description: 'ID тенанта (контекст роли)',
        example: 1,
        required: false,
    })
    declare readonly tenantId?: number;

    @ApiProperty({
        description: 'Дата назначения роли',
        example: '2024-01-15T10:30:00Z',
    })
    declare readonly grantedAt: string;

    @ApiProperty({
        description: 'Дата истечения роли',
        example: '2025-12-31T23:59:59Z',
        required: false,
    })
    declare readonly expiresAt?: string;

    @ApiProperty({
        description: 'Активна ли роль',
        example: true,
    })
    declare readonly isActive: boolean;

    @ApiProperty({
        description: 'Дополнительные метаданные назначения роли',
        example: { reason: 'Promotion', department: 'Sales' },
        required: false,
    })
    declare readonly metadata?: Record<string, unknown>;
}

/**
 * Response для получения ролей пользователя
 */
export class GetUserRolesResponse {
    @ApiProperty({
        description: 'ID пользователя',
        example: 123,
    })
    declare readonly userId: number;

    @ApiProperty({
        description: 'Список ролей пользователя',
        type: [UserRoleInfo],
    })
    declare readonly roles: UserRoleInfo[];

    @ApiProperty({
        description: 'Общее количество ролей',
        example: 3,
    })
    declare readonly totalCount: number;
}

