import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnauthorizedResponse, ForbiddenResponse, NotFoundResponse, createBadRequestSchema } from './common-responses';
import { createIdParam } from './common-schemas';
import { TEMPLATE_SCHEMA } from './create-template.swagger';

export function UpdateTemplateSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить шаблон уведомления',
            description:
                'Обновляет существующий шаблон уведомления. Доступно только менеджерам и администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        createIdParam('шаблона'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Шаблон уведомления обновлен',
            schema: TEMPLATE_SCHEMA,
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Некорректные данные для обновления',
            schema: createBadRequestSchema('Нет данных для обновления'),
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
        NotFoundResponse('Шаблон'),
    );
}
