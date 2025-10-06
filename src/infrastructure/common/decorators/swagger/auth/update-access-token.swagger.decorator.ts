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
        ApiOperation({
            summary: 'Обновить access токен',
            description:
                'Обновляет access токен используя refresh токен. Refresh токен ротируется (старый удаляется, новый создаётся). При обнаружении повторного использования токена все refresh токены пользователя удаляются.',
        }),
        ApiCookieAuth('refreshToken'),
        ApiResponse({
            status: 200,
            description: 'Токен успешно обновлён',
            type: UpdateAccessTokenResponse,
        }),
        ApiResponse({
            status: 401,
            description: 'Refresh токен недействителен или скомпрометирован',
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
