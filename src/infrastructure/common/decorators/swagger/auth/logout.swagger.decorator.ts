import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { LogoutResponse } from '@app/infrastructure/responses';

export function LogoutSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Выход пользователя' }),
        ApiCookieAuth('refreshToken'),
        ApiBearerAuth('JWT-auth'),
        ApiBadRequestResponse({
            description: 'Bad Request',
            schema: {
                anyOf: [
                    {
                        title: 'Refresh token не моет быть пустым',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'refreshToken',
                            messages: ['Refresh token не моет быть пустым'],
                            value: '',
                        },
                    },
                    {
                        title: 'Refresh token должен быть строкой',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'refreshToken',
                            messages: ['Refresh token должен быть строкой'],
                            value: 1,
                        },
                    },
                ],
            },
        }),
        ApiResponse({
            description: 'Remove refresh token',
            status: HttpStatus.OK,
            type: LogoutResponse,
        }),
        ApiUnprocessableEntityResponse({
            schema: {
                anyOf: [
                    {
                        title: 'Не верный формат refresh token',
                        example: {
                            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            message: 'Не верный формат refresh token',
                            error: 'Unprocessable Entity',
                        },
                    },
                    {
                        title: 'Срок действия refresh token истек',
                        example: {
                            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            message: 'Срок действия refresh token истек',
                            error: 'Unprocessable Entity',
                        },
                    },
                ],
            },
        }),
    );
}
