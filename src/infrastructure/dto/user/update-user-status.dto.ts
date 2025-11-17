import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO для обновления статусных флагов пользователя
 * Используется администраторами для управления статусом Beta Tester
 * ⚠️ ПРИМЕЧАНИЕ: поля isPremium и isVipCustomer УДАЛЕНЫ, так как они отсутствуют в UserModel
 */
export class UpdateUserStatusDto {
    @ApiPropertyOptional({
        description: 'Статус Beta-тестера (ранний доступ к новым функциям)',
        example: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'Поле isBetaTester должно быть булевым значением',
    })
    declare readonly isBetaTester?: boolean;
}





