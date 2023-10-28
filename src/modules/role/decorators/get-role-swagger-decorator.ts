import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetRoleResponse } from '../responses/get-role.response';

export function GetRoleSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({ summary: 'Получение роли' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'role',
            type: 'string',
            description: 'Роль пользователя',
            required: true,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            type: GetRoleResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Роль не найдена',
                example: {
                    status: HttpStatus.NOT_FOUND,
                    message: 'Роль не найдена',
                },
            },
        }),
    );
}
