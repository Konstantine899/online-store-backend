import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO для обновления флагов согласий пользователя
 * Используется для GDPR compliance и управления согласиями на маркетинг, рассылку и cookies
 */
export class UpdateConsentsDto {
    @ApiPropertyOptional({
        description: 'Подписка на рассылку новостей и уведомлений',
        example: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'Поле isNewsletterSubscribed должно быть булевым значением',
    })
    declare readonly isNewsletterSubscribed?: boolean;

    @ApiPropertyOptional({
        description: 'Согласие на получение маркетинговых материалов и рекламы',
        example: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'Поле isMarketingConsent должно быть булевым значением',
    })
    declare readonly isMarketingConsent?: boolean;

    @ApiPropertyOptional({
        description:
            'Согласие на использование cookies для аналитики и персонализации',
        example: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'Поле isCookieConsent должно быть булевым значением',
    })
    declare readonly isCookieConsent?: boolean;
}
