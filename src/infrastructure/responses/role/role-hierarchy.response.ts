import { ApiProperty } from '@nestjs/swagger';

/**
 * Узел иерархии ролей
 */
export class RoleNode {
    @ApiProperty({
        description: 'Название роли',
        example: 'SUPER_ADMIN',
    })
    declare readonly role: string;

    @ApiProperty({
        description: 'Уровень в иерархии',
        example: 100,
    })
    declare readonly level: number;

    @ApiProperty({
        description: 'Описание роли',
        example: 'Супер-администратор платформы',
    })
    declare readonly description: string;

    @ApiProperty({
        description: 'Является ли системной ролью',
        example: true,
    })
    declare readonly isSystemRole: boolean;
}

/**
 * Response для получения иерархии ролей
 */
export class GetRoleHierarchyResponse {
    @ApiProperty({
        description: 'Системные роли (Platform)',
        type: [RoleNode],
    })
    declare readonly systemRoles: RoleNode[];

    @ApiProperty({
        description: 'Тенантские роли (Store)',
        type: [RoleNode],
    })
    declare readonly tenantRoles: RoleNode[];

    @ApiProperty({
        description: 'Клиентские роли (User)',
        type: [RoleNode],
    })
    declare readonly customerRoles: RoleNode[];

    @ApiProperty({
        description: 'Общее количество ролей',
        example: 14,
    })
    declare readonly totalCount: number;
}

