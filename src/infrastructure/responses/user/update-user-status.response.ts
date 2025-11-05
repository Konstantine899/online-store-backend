import { ApiProperty } from '@nestjs/swagger';

/**
 * Response класс для обновления статусных флагов пользователя
 * Используется для аудита изменений статусов администраторами
 */
export class UpdateUserStatusResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    declare readonly id: number;

    @ApiProperty({
        example: true,
        description: 'Статус VIP-клиента',
    })
    declare readonly isVipCustomer: boolean;

    @ApiProperty({
        example: true,
        description: 'Статус Premium-пользователя',
    })
    declare readonly isPremium: boolean;

    @ApiProperty({
        example: false,
        description: 'Статус Beta-тестера',
    })
    declare readonly isBetaTester: boolean;
}
