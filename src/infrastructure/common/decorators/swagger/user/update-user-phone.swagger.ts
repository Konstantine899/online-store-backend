import { UpdateUserPhoneDto } from '@app/infrastructure/dto';
import { UpdateUserPhoneResponse } from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const UpdateUserPhoneSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновление номера телефона пользователя',
            description:
                'Позволяет пользователю обновить свой номер телефона. Поддерживаются российские форматы (+7, 8, без префикса) и международный формат E.164. Доступно всем аутентифицированным пользователям.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: UpdateUserPhoneDto,
            description: 'Данные для обновления номера телефона',
            examples: {
                example1: {
                    summary: 'Российский номер с +7',
                    value: {
                        phone: '+79991234567',
                    },
                },
                example2: {
                    summary: 'Российский номер с 8',
                    value: {
                        phone: '89991234567',
                    },
                },
                example3: {
                    summary: 'Российский номер без префикса',
                    value: {
                        phone: '79991234567',
                    },
                },
                example4: {
                    summary: 'Российский номер с форматированием',
                    value: {
                        phone: '+7 (999) 123-45-67',
                    },
                },
                example5: {
                    summary: 'Международный формат',
                    value: {
                        phone: '+375291234567',
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Телефон успешно обновлён',
            type: UpdateUserPhoneResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные данные (неверный формат номера телефона)',
            schema: {
                example: {
                    statusCode: 400,
                    message: [
                        'Неверный формат номера телефона',
                        'Номер телефона должен быть в формате: +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX или международный формат',
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
