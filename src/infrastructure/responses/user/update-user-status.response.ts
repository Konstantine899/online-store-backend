import { ApiProperty } from '@nestjs/swagger';

/**
 * Response класс для обновления статусных флагов пользователя
 * Используется для аудита изменений статусов администраторами
 *
 * TODO: Поля isVipCustomer/isPremium/isBetaTester удалены миграцией 20251015135614
 * Метод требует рефакторинга для работы с новой моделью ролей/подписок
 */
export class UpdateUserStatusResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    declare readonly id: number;
}
