import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { RevokeRoleDto } from '@app/infrastructure/dto';
import { RevokeRoleResponse } from '@app/infrastructure/responses';

export function RevokeRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Отзыв роли у пользователя',
            description: 'Отзывает указанную роль у пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            description: 'Данные для отзыва роли',
            type: RevokeRoleDto,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Роль успешно отозвана у пользователя',
            type: RevokeRoleResponse,
        }),
        ApiNotFoundResponse({
            description: 'Пользователь, роль или назначение не найдены',
            schema: {
                title: 'Ресурс не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Назначение роли не найдено',
                },
            },
        }),
    );
}

