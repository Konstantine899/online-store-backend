import { ApiProperty } from '@nestjs/swagger';

/**
 * Ответ с настройками уведомлений пользователя
 */
export class UserNotificationSettingsResponse {
    @ApiProperty({
        example: 1,
        description: 'ID настроек уведомлений',
    })
    declare readonly id: number;

    @ApiProperty({
        example: 123,
        description: 'ID пользователя',
    })
    declare readonly userId: number;

    @ApiProperty({
        example: true,
        description: 'Включены ли email уведомления',
    })
    declare readonly emailEnabled: boolean;

    @ApiProperty({
        example: true,
        description: 'Включены ли push уведомления',
    })
    declare readonly pushEnabled: boolean;

    @ApiProperty({
        example: true,
        description: 'Включены ли обновления о заказах',
    })
    declare readonly orderUpdates: boolean;

    @ApiProperty({
        example: false,
        description: 'Включены ли маркетинговые уведомления',
    })
    declare readonly marketing: boolean;
}
