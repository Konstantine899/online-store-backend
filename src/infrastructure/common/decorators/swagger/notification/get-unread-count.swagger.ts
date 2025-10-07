import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';

export function GetUnreadCountSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить количество непрочитанных уведомлений',
            description:
                'Возвращает количество непрочитанных уведомлений для пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Количество непрочитанных уведомлений',
            schema: {
                type: 'object',
                properties: {
                    count: { type: 'number', example: 5 },
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

