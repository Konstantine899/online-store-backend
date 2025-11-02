import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserNotificationSettingsResponse } from '@app/infrastructure/responses/notification/user-notification-settings.response';
import { UnauthorizedResponse, ForbiddenResponse } from './common-responses';

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
            type: UserNotificationSettingsResponse,
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
    );
}
