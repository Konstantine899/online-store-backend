import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetRolePermissionsResponse } from '@app/infrastructure/responses';

export function GetRolePermissionsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение разрешений роли',
            description:
                'Возвращает список всех разрешений (permissions), назначенных роли',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'roleId',
            type: Number,
            description: 'ID роли',
            example: 5,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Список разрешений роли успешно получен',
            type: GetRolePermissionsResponse,
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

