import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
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
        ApiBadRequestResponse({
            description: 'Некорректные данные',
            schema: {
                title: 'Ошибка валидации',
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'userId должен быть целым числом',
                        'roleId должен быть положительным числом',
                    ],
                },
            },
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
            schema: {
                title: 'Доступ запрещён',
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас недостаточно прав для отзыва ролей',
                },
            },
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

