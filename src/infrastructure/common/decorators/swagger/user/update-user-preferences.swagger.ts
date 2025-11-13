import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { UpdateUserPreferencesResponse } from '@app/infrastructure/responses';

export function UpdateUserPreferencesSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить предпочтения пользователя',
            description:
                'Обновляет предпочтения интерфейса (тема, язык, часовой пояс), настройки уведомлений и персональные переводы текущего пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({ type: UpdateUserPreferencesDto }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Предпочтения успешно обновлены',
            type: UpdateUserPreferencesResponse,
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description:
                'Некорректные данные (неподдерживаемый язык/тема/часовой пояс)',
        }),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Требуется аутентификация',
        }),
        ApiResponse({
            status: HttpStatus.NOT_FOUND,
            description: 'Пользователь не найден',
        }),
    );
}
