import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO для обновления статусных флагов пользователя
 * Используется администраторами для управления статусами пользователей (VIP, Premium, Beta Tester)
 */
export class UpdateUserStatusDto {
    @ApiPropertyOptional({
        description:
            'Статус VIP-клиента (привилегированный доступ, специальные предложения)',
        example: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'Поле isVipCustomer должно быть булевым значением',
    })
    declare readonly isVipCustomer?: boolean;

    @ApiPropertyOptional({
        description:
            'Статус Premium-пользователя (расширенные возможности, приоритетная поддержка)',
        example: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'Поле isPremium должно быть булевым значением',
    })
    declare readonly isPremium?: boolean;

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




