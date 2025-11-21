import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetUserRolesResponse } from '@app/infrastructure/responses';

export function GetUserRolesSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение ролей пользователя',
            description:
                'Возвращает список всех ролей, назначенных пользователю',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'userId',
            type: Number,
            description: 'ID пользователя',
            example: 123,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Список ролей пользователя успешно получен',
            type: GetUserRolesResponse,
        }),
        ApiNotFoundResponse({
            description: 'Пользователь не найден',
            schema: {
                title: 'Пользователь не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Пользователь с указанным ID не найден',
                },
            },
        }),
    );
}

