import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetUserResponse } from '@app/infrastructure/responses';

export function GetUserSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Получение пользователя по идентификатору' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            description: 'идентификатор пользователя',
            name: 'id',
            type: 'string',
            required: true,
        }),
        ApiResponse({
            description: 'Get user',
            status: HttpStatus.OK,
            type: GetUserResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Пользователь не найден в БД',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/user/611',
                    path: '/online-store/user/611',
                    name: 'NotFoundException',
                    message: 'Пользователь не найден В БД',
                },
            },
        }),
    );
}
