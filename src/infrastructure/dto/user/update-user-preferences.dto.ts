import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateUserPreferencesDto {
    @ApiPropertyOptional({ description: 'Тема интерфейса', enum: ['light', 'dark', 'auto'] })
    @IsOptional()
    @IsString({ message: 'Поле themePreference должно быть строкой' })
    @IsIn(['light', 'dark', 'auto'], { message: 'Тема должна быть одной из: light | dark | auto' })
    declare readonly themePreference?: string;

    @ApiPropertyOptional({ description: 'Язык по умолчанию', enum: ['ru', 'en', 'es', 'de', 'fr'] })
    @IsOptional()
    @IsString({ message: 'Поле defaultLanguage должно быть строкой' })
    @IsIn(['ru', 'en', 'es', 'de', 'fr'], { message: 'Язык должен быть одним из: ru | en | es | de | fr' })
    declare readonly defaultLanguage?: string;

    @ApiPropertyOptional({ description: 'Настройки уведомлений (произвольный объект)' })
    @IsOptional()
    @IsObject({ message: 'Поле notificationPreferences должно быть объектом' })
    declare readonly notificationPreferences?: Record<string, unknown>;

    @ApiPropertyOptional({ description: 'Персональные переводы пользователя (произвольный объект)' })
    @IsOptional()
    @IsObject({ message: 'Поле translations должно быть объектом' })
    declare readonly translations?: Record<string, unknown>;
}


