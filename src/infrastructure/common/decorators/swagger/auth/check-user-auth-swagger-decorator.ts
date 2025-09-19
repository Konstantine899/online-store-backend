import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CheckResponse } from '@app/infrastructure/responses';
import { UserModel } from '@app/domain/models';

export function CheckUserAuthSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Проверка авторизации пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: UserModel,
            required: true,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            type: CheckResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Профиль пользователя не найден в БД',
                example: {
                    statusCode: 404,
                    message: 'Профиль пользователя не найден в БД',
                },
            },
        }),
    );
}
