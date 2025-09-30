import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';

export function UpdateUserPreferencesSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить предпочтения пользователя',
            description: 'Обновляет предпочтения интерфейса и уведомлений текущего пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({ type: UpdateUserPreferencesDto }),
        ApiResponse({ status: HttpStatus.OK, description: 'Предпочтения обновлены' }),
    );
}


