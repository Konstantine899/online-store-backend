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
import { AssignPermissionDto } from '@app/infrastructure/dto';
import { AssignPermissionResponse } from '@app/infrastructure/responses';

export function AssignPermissionSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Назначение разрешения роли',
            description: 'Добавляет разрешение (resource + action) к роли',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            description: 'Данные для назначения разрешения',
            type: AssignPermissionDto,
        }),
        ApiResponse({
            status: HttpStatus.CREATED,
            description: 'Разрешение успешно назначено роли',
            type: AssignPermissionResponse,
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
            description: 'Роль не найдена',
            schema: {
                title: 'Роль не найдена',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Роль с указанным ID не найдена',
                },
            },
        }),
    );
}

