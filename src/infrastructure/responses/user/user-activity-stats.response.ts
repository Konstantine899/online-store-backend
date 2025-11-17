import { ApiProperty } from '@nestjs/swagger';

/**
 * Статистика активности пользователей
 * Показывает последнюю активность пользователей в системе
 */
export class UserActivityStatsResponse {
    @ApiProperty({
        description: 'Количество пользователей, активных за последние 24 часа',
        example: 340,
    })
    declare activeInLast24Hours: number;

    @ApiProperty({
        description: 'Количество пользователей, активных за последние 7 дней',
        example: 890,
    })
    declare activeInLast7Days: number;

    @ApiProperty({
        description: 'Количество пользователей, активных за последние 30 дней',
        example: 1200,
    })
    declare activeInLast30Days: number;

    @ApiProperty({
        description: 'Количество пользователей, которые никогда не логинились',
        example: 150,
    })
    declare neverLoggedIn: number;

    @ApiProperty({
        description: 'Общее количество пользователей (активные + неактивные)',
        example: 1450,
    })
    declare totalUsers: number;
}


