import { UpdateUserProfileDto } from '@app/infrastructure/dto';
import { UpdateUserResponse } from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function UpdateUserProfileSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновление профиля пользователя',
            description:
                'Позволяет пользователю обновить своё имя и фамилию в профиле. Доступно всем аутентифицированным пользователям.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: UpdateUserProfileDto,
            description: 'Данные для обновления профиля пользователя',
            examples: {
                example1: {
                    summary: 'Обновление имени и фамилии',
                    value: {
                        firstName: 'Иван',
                        lastName: 'Иванов',
                    },
                },
                example2: {
                    summary: 'Обновление только имени',
                    value: {
                        firstName: 'Пётр',
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Профиль успешно обновлён',
            type: UpdateUserResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные данные (имя/фамилия слишком короткие или содержат недопустимые символы)',
            schema: {
                example: {
                    statusCode: 400,
                    message: [
                        'Имя должно содержать минимум 2 символа',
                        'Фамилия содержит недопустимые символы',
                    ],
                    error: 'Bad Request',
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
    );
}
