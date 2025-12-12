import { UpdateRoleDto } from '@app/infrastructure/dto';
import { UpdateRoleResponse } from '@app/infrastructure/responses';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export function UpdateRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновление роли',
            description:
                'Обновление существующей роли. Все поля опциональны (PATCH).',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: Number,
            description: 'ID роли для обновления',
            example: 5,
        }),
        ApiBody({
            description: 'Данные для обновления роли',
            type: UpdateRoleDto,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Роль успешно обновлена',
            type: UpdateRoleResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
            schema: {
                title: 'Ошибка валидации',
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'Укажите название роли',
                        'Уровень не может быть больше 100',
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
                        'У вас недостаточно прав для выполнения этой операции',
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
