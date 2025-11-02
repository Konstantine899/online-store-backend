import { UserNotificationSettingsResponse } from '@app/infrastructure/responses/notification/user-notification-settings.response';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForbiddenResponse, UnauthorizedResponse } from './common-responses';

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
            type: UserNotificationSettingsResponse,
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
    );
}
