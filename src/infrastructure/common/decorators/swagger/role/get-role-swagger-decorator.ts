import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetRoleResponse } from '@app/infrastructure/responses';

export function GetRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение информации о роли',
            description: 'Возвращает детальную информацию о роли',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'role',
            type: 'string',
            description: 'Название роли (например, ADMIN, USER)',
            required: true,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Информация о роли успешно получена',
            type: GetRoleResponse,
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
            schema: {
                title: 'Доступ запрещён',
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас недостаточно прав для просмотра роли',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Роль не найдена',
            schema: {
                title: 'Роль не найдена',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Роль не найдена',
                },
            },
        }),
    );
}
