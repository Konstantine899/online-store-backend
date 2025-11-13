import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response для обновления предпочтений пользователя
 * Содержит только поля предпочтений (не весь User объект)
 */
export class UpdateUserPreferencesResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    declare id: number;

    @ApiProperty({
        example: 'user@example.com',
        description: 'Email пользователя',
    })
    declare email: string;

    @ApiProperty({
        example: 'dark',
        description: 'Тема интерфейса',
        enum: ['light', 'dark', 'auto'],
    })
    declare themePreference: string;

    @ApiProperty({
        example: 'en',
        description: 'Предпочитаемый язык интерфейса',
        enum: ['ru', 'en', 'es', 'de', 'fr'],
    })
    declare preferredLanguage: string;

    @ApiProperty({
        example: 'ru',
        description: 'Язык по умолчанию для контента',
        enum: ['ru', 'en', 'es', 'de', 'fr'],
    })
    declare defaultLanguage: string;

    @ApiProperty({
        example: 'Europe/Moscow',
        description: 'Часовой пояс пользователя (IANA timezone)',
    })
    declare timezone: string;

    @ApiPropertyOptional({
        example: { email: true, sms: false, push: true },
        description: 'Настройки уведомлений',
    })
    declare notificationPreferences?: Record<string, unknown> | null;

    @ApiPropertyOptional({
        example: { 'welcome.title': 'Привет!', 'button.submit': 'Отправить' },
        description: 'Персональные переводы пользователя',
    })
    declare translations?: Record<string, unknown> | null;
}

