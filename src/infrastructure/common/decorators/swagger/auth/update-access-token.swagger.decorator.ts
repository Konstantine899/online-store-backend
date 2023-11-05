import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { RefreshDto } from '@app/infrastructure/dto';
import { UpdateAccessTokenResponse } from '@app/infrastructure/responses';

export function UpdateAccessTokenSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Обновление access token' }),
        ApiBody({
            type: RefreshDto,
            description: 'Структура данных для обновления access token',
        }),
        ApiResponse({
            description: 'Updated Access Token',
            status: HttpStatus.CREATED,
            type: UpdateAccessTokenResponse,
        }),
        ApiNotFoundResponse({
            status: HttpStatus.NOT_FOUND,
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
            status: HttpStatus.UNPROCESSABLE_ENTITY,
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
