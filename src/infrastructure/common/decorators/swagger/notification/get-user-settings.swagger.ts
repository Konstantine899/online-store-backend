import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnauthorizedResponse, ForbiddenResponse } from './common-responses';

// Схема настроек вынесена для переиспользования
const USER_SETTINGS_SCHEMA = {
    type: 'object' as const,
    properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'number', example: 123 },
        emailEnabled: { type: 'boolean', example: true },
        pushEnabled: { type: 'boolean', example: true },
        orderUpdates: { type: 'boolean', example: true },
        marketing: { type: 'boolean', example: false },
    },
};

export function GetUserSettingsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить настройки уведомлений пользователя',
            description: 'Возвращает настройки уведомлений для пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Настройки уведомлений получены',
            schema: USER_SETTINGS_SCHEMA,
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
    );
}

// Экспортируем схему для использования в update-user-settings
export { USER_SETTINGS_SCHEMA };
