import { ApiProperty } from '@nestjs/swagger';

/**
 * Статистика пользователей по роли
 * Показывает количество пользователей для каждой роли в системе
 */
export class RoleStats {
    @ApiProperty({
        description: 'Название роли',
        example: 'USER',
    })
    declare role: string;

    @ApiProperty({
        description: 'Количество пользователей с этой ролью',
        example: 1250,
    })
    declare count: number;

    @ApiProperty({
        description: 'Процент от общего числа пользователей',
        example: 85.5,
    })
    declare percentage: number;
}

/**
 * Response для статистики пользователей по ролям
 */
export class UserStatsByRoleResponse {
    @ApiProperty({
        type: [RoleStats],
        description: 'Статистика по каждой роли',
        example: [
            { role: 'USER', count: 1250, percentage: 85.5 },
            { role: 'ADMIN', count: 150, percentage: 10.2 },
            { role: 'SUPER_ADMIN', count: 50, percentage: 3.4 },
        ],
    })
    declare roles: RoleStats[];

    @ApiProperty({
        description: 'Общее количество пользователей',
        example: 1450,
    })
    declare totalUsers: number;
}
