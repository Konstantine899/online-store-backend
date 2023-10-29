import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveUserResponse } from '../responses/remove-user.response';

export function RemoveUserSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: 'string',
            description: 'идентификатор пользователя',
            required: true,
        }),
        ApiResponse({
            description: 'Remove user',
            status: HttpStatus.OK,
            type: RemoveUserResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Пользователь не найден В БД',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/user/delete/62',
                    path: '/online-store/user/delete/62',
                    name: 'NotFoundException',
                    message: 'Пользователь не найден в БД',
                },
            },
        }),
    );
}
