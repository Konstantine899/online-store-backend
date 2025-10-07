import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export function MarkAsReadSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Отметить уведомление как прочитанное',
            description:
                'Отмечает уведомление как прочитанное. Клиенты могут отмечать только свои уведомления.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            description: 'ID уведомления',
            example: 1,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Уведомление отмечено как прочитанное',
            schema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        example: 'Уведомление отмечено как прочитанное',
                    },
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
        ApiResponse({
            status: HttpStatus.NOT_FOUND,
            description: 'Уведомление не найдено',
        }),
    );
}

