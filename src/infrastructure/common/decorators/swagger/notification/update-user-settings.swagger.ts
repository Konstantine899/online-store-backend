import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnauthorizedResponse, ForbiddenResponse } from './common-responses';
import { USER_SETTINGS_SCHEMA } from './get-user-settings.swagger';

export function UpdateUserSettingsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить настройки уведомлений пользователя',
            description: 'Обновляет настройки уведомлений для пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Настройки уведомлений обновлены',
            schema: {
                ...USER_SETTINGS_SCHEMA,
                properties: {
                    ...USER_SETTINGS_SCHEMA.properties,
                    pushEnabled: { type: 'boolean', example: false },
                    marketing: { type: 'boolean', example: true },
                },
            },
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
    );
}
