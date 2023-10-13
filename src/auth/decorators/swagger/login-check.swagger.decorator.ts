import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { LoginCheckRequest } from '../../requests/login-check.request';
import { LoginCheckResponse } from '../../responses/login-check.response';

export function LoginCheckSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({ summary: 'Проверка авторизации пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: LoginCheckRequest,
            required: true,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            type: LoginCheckResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
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
