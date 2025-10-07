import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export function DeleteTemplateSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Удалить шаблон уведомления',
            description:
                'Удаляет шаблон уведомления. Доступно только администраторам тенанта и платформы.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            description: 'ID шаблона',
            example: 1,
        }),
        ApiResponse({
            status: HttpStatus.NO_CONTENT,
            description: 'Шаблон уведомления удален',
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
            description: 'Шаблон не найден',
        }),
    );
}

