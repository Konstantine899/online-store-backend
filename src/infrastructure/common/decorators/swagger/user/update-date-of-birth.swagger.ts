import { UpdateDateOfBirthDto } from '@app/infrastructure/dto';
import { UpdateDateOfBirthResponse } from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const UpdateDateOfBirthSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновление даты рождения пользователя',
            description:
                'Позволяет пользователю обновить свою дату рождения. Возраст должен быть от 18 до 150 лет. Дата не может быть в будущем. Доступно всем аутентифицированным пользователям.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: UpdateDateOfBirthDto,
            description: 'Данные для обновления даты рождения',
            examples: {
                example1: {
                    summary: 'Валидная дата рождения (18 лет)',
                    value: {
                        dateOfBirth: '2006-01-15',
                    },
                },
                example2: {
                    summary: 'Валидная дата рождения (25 лет)',
                    value: {
                        dateOfBirth: '1999-05-20',
                    },
                },
                example3: {
                    summary: 'Валидная дата рождения (50 лет)',
                    value: {
                        dateOfBirth: '1974-12-31',
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Дата рождения успешно обновлена',
            type: UpdateDateOfBirthResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные данные (неверный формат даты, возраст менее 18 лет, дата в будущем)',
            schema: {
                example: {
                    statusCode: 400,
                    message: [
                        'Дата рождения должна соответствовать возрасту от 18 до 150 лет',
                        'Дата рождения должна быть в формате YYYY-MM-DD',
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
