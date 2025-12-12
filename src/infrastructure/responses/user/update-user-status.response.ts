import { ApiProperty } from '@nestjs/swagger';

/**
 * Response класс для обновления статусных флагов пользователя
 * ⚠️ ВАЖНО: все статусные поля (isPremium, isVipCustomer, isBetaTester) удалены из UserModel
 * Endpoint оставлен для обратной совместимости, но не выполняет реальных обновлений
 */
export class UpdateUserStatusResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    declare readonly id: number;
}
