import { ApiProperty } from '@nestjs/swagger';

/**
 * Информация об одном разрешении роли
 */
export class RolePermissionInfo {
    @ApiProperty({
        description: 'ID записи role_permission',
        example: 15,
    })
    declare readonly id: number;

    @ApiProperty({
        description: 'Ресурс',
        example: 'products',
    })
    declare readonly resource: string;

    @ApiProperty({
        description: 'Действие',
        example: 'create',
    })
    declare readonly action: string;

    @ApiProperty({
        description: 'Условия доступа',
        example: { own_tenant_only: true },
        required: false,
    })
    declare readonly conditions?: Record<string, unknown>;
}

/**
 * Response для получения разрешений роли
 */
export class GetRolePermissionsResponse {
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
        description: 'Список разрешений',
        type: [RolePermissionInfo],
    })
    declare readonly permissions: RolePermissionInfo[];

    @ApiProperty({
        description: 'Общее количество разрешений',
        example: 12,
    })
    declare readonly totalCount: number;
}

