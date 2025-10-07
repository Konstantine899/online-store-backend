import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnauthorizedResponse, ForbiddenResponse, NotFoundResponse, MESSAGE_RESPONSE_SCHEMA } from './common-responses';
import { createIdParam } from './common-schemas';

export function MarkAsReadSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Отметить уведомление как прочитанное',
            description:
                'Отмечает уведомление как прочитанное. Клиенты могут отмечать только свои уведомления.',
        }),
        ApiBearerAuth('JWT-auth'),
        createIdParam('уведомления'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Уведомление отмечено как прочитанное',
            schema: {
                ...MESSAGE_RESPONSE_SCHEMA,
                properties: {
                    message: {
                        type: 'string',
                        example: 'Уведомление отмечено как прочитанное',
                    },
                },
            },
        }),
        UnauthorizedResponse(),
        ForbiddenResponse(),
        NotFoundResponse('Уведомление'),
    );
}
