import { ApiProperty } from '@nestjs/swagger';

/**
 * Response класс для обновления флагов согласий пользователя
 * Используется для GDPR compliance и аудита изменений согласий
 */
export class UpdateConsentsResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    declare readonly id: number;

    @ApiProperty({
        example: true,
        description: 'Подписка на рассылку новостей и уведомлений',
    })
    declare readonly isNewsletterSubscribed: boolean;

    @ApiProperty({
        example: true,
        description: 'Согласие на получение маркетинговых материалов и рекламы',
    })
    declare readonly isMarketingConsent: boolean;

    @ApiProperty({
        example: true,
        description:
            'Согласие на использование cookies для аналитики и персонализации',
    })
    declare readonly isCookieConsent: boolean;
}
