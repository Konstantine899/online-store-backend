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
import { RevokePermissionDto } from '@app/infrastructure/dto';
import { RevokePermissionResponse } from '@app/infrastructure/responses';

export function RevokePermissionSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Отзыв разрешения у роли',
            description: 'Удаляет разрешение (resource + action) у роли',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            description: 'Данные для отзыва разрешения',
            type: RevokePermissionDto,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Разрешение успешно отозвано у роли',
            type: RevokePermissionResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
            schema: {
                title: 'Ошибка валидации',
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'resource не может быть пустым',
                        'action не может быть длиннее 50 символов',
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
                    message:
                        'У вас недостаточно прав для управления разрешениями',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Роль или разрешение не найдены',
            schema: {
                title: 'Ресурс не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Разрешение не найдено',
                },
            },
        }),
    );
}

