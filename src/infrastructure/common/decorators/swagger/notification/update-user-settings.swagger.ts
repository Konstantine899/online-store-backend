import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';

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
                type: 'object',
                properties: {
                    id: { type: 'number', example: 1 },
                    userId: { type: 'number', example: 123 },
                    emailEnabled: { type: 'boolean', example: true },
                    pushEnabled: { type: 'boolean', example: false },
                    orderUpdates: { type: 'boolean', example: true },
                    marketing: { type: 'boolean', example: true },
                },
            },
        }),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Не авторизован',
        }),
        ApiResponse({
            status: HttpStatus.FORBIDDEN,
            description: 'Недостаточно прав доступа',
        }),
    );
}

