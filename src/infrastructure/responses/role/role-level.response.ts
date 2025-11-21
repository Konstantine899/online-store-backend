import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для получения уровня роли
 */
export class GetRoleLevelResponse {
    @ApiProperty({
        description: 'Название роли',
        example: 'MANAGER',
    })
    declare readonly role: string;

    @ApiProperty({
        description: 'Уровень в иерархии',
        example: 50,
    })
    declare readonly level: number;

    @ApiProperty({
        description: 'Категория роли',
        example: 'tenant',
        enum: ['system', 'tenant', 'customer'],
    })
    declare readonly category: 'system' | 'tenant' | 'customer';

    @ApiProperty({
        description: 'Роли, которыми может управлять данная роль',
        type: [String],
        example: ['CONTENT_MANAGER', 'CUSTOMER_SERVICE', 'VIP_CUSTOMER'],
    })
    declare readonly manageableRoles: string[];
}

