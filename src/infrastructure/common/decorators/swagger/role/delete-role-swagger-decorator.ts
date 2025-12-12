import { DeleteRoleResponse } from '@app/infrastructure/responses';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export function DeleteRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Удаление роли',
            description:
                'Удаление роли из системы. Системные роли не могут быть удалены.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: Number,
            description: 'ID роли для удаления',
            example: 5,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Роль успешно удалена',
            type: DeleteRoleResponse,
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав или попытка удалить системную роль',
            schema: {
                title: 'Доступ запрещён',
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message:
                        'У вас недостаточно прав для удаления ролей или нельзя удалить системную роль',
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

