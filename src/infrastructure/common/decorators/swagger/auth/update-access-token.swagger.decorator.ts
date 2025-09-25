import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { UpdateAccessTokenResponse } from '@app/infrastructure/responses';

export function UpdateAccessTokenSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Обновление access token по refresh из HttpOnly cookie' }),
        ApiCookieAuth('refreshToken'),
        ApiResponse({
            description: 'Updated Access Token',
            status: HttpStatus.OK,
            type: UpdateAccessTokenResponse,
        }),
        ApiNotFoundResponse({
            schema: {
                example: {
                    title: 'Refresh token не найден в БД',
                    example: {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        message: 'Refresh token не найден в БД',
                        error: 'Unprocessable Entity',
                    },
                },
            },
        }),
        ApiUnprocessableEntityResponse({
            description: 'Unprocessable Entity',
            schema: {
                anyOf: [
                    {
                        title: 'id refresh token не получен из payload',

                        example: {
                            status: HttpStatus.UNPROCESSABLE_ENTITY,
                            message: 'id refresh token не получен из payload',
                            error: 'Unprocessable Entity',
                        },
                    },
                    {
                        title: 'Не верный формат refresh token',

                        example: {
                            status: HttpStatus.UNPROCESSABLE_ENTITY,
                            message: 'Не верный формат refresh token',
                            error: 'Unprocessable Entity',
                        },
                    },
                    {
                        title: 'Срок действия refresh token истек',
                        description: 'Refresh token с истекшим сроком действия',
                        example: {
                            status: HttpStatus.UNPROCESSABLE_ENTITY,
                            message: 'Срок действия refresh token истек',
                            error: 'Unprocessable Entity',
                        },
                    },
                ],
            },
        }),
    );
}
