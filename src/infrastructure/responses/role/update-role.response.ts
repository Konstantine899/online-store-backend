import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для обновления роли
 */
export class UpdateRoleResponse {
    @ApiProperty({
        example: 'Роль успешно обновлена',
        description: 'Сообщение о результате операции',
    })
    declare message: string;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор роли',
    })
    declare id: number;

    @ApiProperty({
        example: 'TENANT_MANAGER',
        description: 'Название роли (UPPER_SNAKE_CASE)',
    })
    declare role: string;

    @ApiProperty({
        example: 'Менеджер тенанта',
        description: 'Описание роли',
    })
    declare description: string;

    @ApiProperty({
        example: 50,
        description: 'Уровень иерархии роли (0-100, где 100 - SUPER_ADMIN)',
    })
    declare level: number;

    @ApiProperty({
        example: [
            { resource: 'products', action: 'manage' },
            { resource: 'orders', action: 'read' },
        ],
        description: 'Разрешения роли (массив объектов)',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                resource: { type: 'string', example: 'products' },
                action: { type: 'string', example: 'manage' },
                conditions: { type: 'object' },
            },
            required: ['resource', 'action'],
        },
    })
    declare permissions: unknown[];

    @ApiProperty({
        example: false,
        description: 'Системная роль (true) или tenant-specific роль (false)',
    })
    declare isSystemRole: boolean;

    @ApiProperty({
        example: true,
        description: 'Активна ли роль',
    })
    declare isActive: boolean;

    @ApiProperty({
        example: 1,
        description: 'ID тенанта (NULL для системных ролей)',
        required: false,
    })
    declare tenantId: number | null;

    @ApiProperty({
        example: '2024-11-21T12:00:00Z',
        description: 'Дата последнего обновления',
    })
    declare updatedAt: Date;
}
