import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';

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
            schema: {
                type: 'object',
                properties: {
                    id: { type: 'number', example: 1 },
                    userId: { type: 'number', example: 123 },
                    emailEnabled: { type: 'boolean', example: true },
                    pushEnabled: { type: 'boolean', example: true },
                    orderUpdates: { type: 'boolean', example: true },
                    marketing: { type: 'boolean', example: false },
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

