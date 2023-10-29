import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CheckResponse } from '../../responses/check-response';
import { UserModel } from '../../../user/user.model';

export function CheckUserAuthSwaggerDecorator(): Function {
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
