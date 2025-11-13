import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateUserPreferencesDto {
    @ApiPropertyOptional({
        description: 'Тема интерфейса',
        enum: ['light', 'dark', 'auto'],
        example: 'dark',
    })
    @IsOptional()
    @IsString({ message: 'Поле themePreference должно быть строкой' })
    @IsIn(['light', 'dark', 'auto'], {
        message: 'Тема должна быть одной из: light | dark | auto',
    })
    declare readonly themePreference?: string;

    @ApiPropertyOptional({
        description:
            'Предпочитаемый язык интерфейса (основной язык пользователя)',
        enum: ['ru', 'en', 'es', 'de', 'fr'],
        example: 'en',
    })
    @IsOptional()
    @IsString({ message: 'Поле preferredLanguage должно быть строкой' })
    @IsIn(['ru', 'en', 'es', 'de', 'fr'], {
        message: 'Язык должен быть одним из: ru | en | es | de | fr',
    })
    declare readonly preferredLanguage?: string;

    @ApiPropertyOptional({
        description: 'Язык по умолчанию для контента (fallback язык)',
        enum: ['ru', 'en', 'es', 'de', 'fr'],
        example: 'ru',
    })
    @IsOptional()
    @IsString({ message: 'Поле defaultLanguage должно быть строкой' })
    @IsIn(['ru', 'en', 'es', 'de', 'fr'], {
        message: 'Язык должен быть одним из: ru | en | es | de | fr',
    })
    declare readonly defaultLanguage?: string;

    @ApiPropertyOptional({
        description: 'Часовой пояс пользователя (IANA timezone)',
        enum: [
            'UTC',
            'Europe/Moscow',
            'Europe/London',
            'Europe/Paris',
            'America/New_York',
            'America/Los_Angeles',
            'America/Chicago',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Asia/Dubai',
            'Australia/Sydney',
        ],
        example: 'Europe/Moscow',
    })
    @IsOptional()
    @IsString({ message: 'Поле timezone должно быть строкой' })
    @IsIn(
        [
            'UTC',
            'Europe/Moscow',
            'Europe/London',
            'Europe/Paris',
            'America/New_York',
            'America/Los_Angeles',
            'America/Chicago',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Asia/Dubai',
            'Australia/Sydney',
        ],
        {
            message:
                'Часовой пояс должен быть одним из поддерживаемых IANA timezone',
        },
    )
    declare readonly timezone?: string;

    @ApiPropertyOptional({
        description: 'Настройки уведомлений (произвольный объект)',
        example: { email: true, sms: false, push: true },
    })
    @IsOptional()
    @IsObject({ message: 'Поле notificationPreferences должно быть объектом' })
    declare readonly notificationPreferences?: Record<string, unknown>;

    @ApiPropertyOptional({
        description: 'Персональные переводы пользователя (произвольный объект)',
        example: { 'welcome.title': 'Привет!', 'button.submit': 'Отправить' },
    })
    @IsOptional()
    @IsObject({ message: 'Поле translations должно быть объектом' })
    declare readonly translations?: Record<string, unknown>;
}
