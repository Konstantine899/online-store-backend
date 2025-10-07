import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
    UnauthorizedResponse,
    ForbiddenResponse,
    NotFoundResponse,
} from './common-responses';
import { createIdParam } from './common-schemas';

export function DeleteTemplateSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Удалить шаблон уведомления',
            description:
                'Удаляет шаблон уведомления. Доступно только администраторам тенанта и платформы.',
        }),
        ApiBearerAuth('JWT-auth'),
        createIdParam('шаблона'),
        ApiResponse({
            status: HttpStatus.NO_CONTENT,
            description: 'Шаблон уведомления удален',
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
        NotFoundResponse('Шаблон'),
    );
}
