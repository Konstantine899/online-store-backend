import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistrationDto } from '@app/infrastructure/dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { RegistrationResponse } from '@app/infrastructure/responses';

export function RegistrationSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Регистрация' }),
        ApiBody({
            type: RegistrationDto,
            description:
                'Структура входных данных для регистрации пользователя',
            schema: {
                examples: {
                    valid: {
                        summary: 'Валидная регистрация',
                        value: {
                            email: 'newuser@example.com',
                            password: 'MySecure123!',
                        },
                    },
                    invalid_email: {
                        summary: 'Невалидный email',
                        value: {
                            email: 'not-an-email',
                            password: 'MySecure123!',
                        },
                    },
                    weak_password: {
                        summary: 'Слабый пароль (не пройдёт IsPasswordStrong)',
                        value: {
                            email: 'newuser@example.com',
                            password: '123456',
                        },
                    },
                },
            },
        }),
        ApiResponse({
            description: 'Created',
            status: HttpStatus.CREATED,
            type: RegistrationResponse,
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            schema: {
                title: 'Электронная почта найдена в БД',
                description: 'Электронная почта должна быть уникальной',
                example: {
                    status: HttpStatus.BAD_REQUEST,
                    message:
                        'Пользователь с таким email: test@gmail.com уже существует',
                },
            },
        }),
    );
}
