import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CheckUserAuthResponse } from '../../responses/check-user-auth-response';
import { UserModel } from '../../../user/user.model';

export function CheckUserAuthSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({ summary: 'Проверка авторизации пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: UserModel,
            required: true,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            type: CheckUserAuthResponse,
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
