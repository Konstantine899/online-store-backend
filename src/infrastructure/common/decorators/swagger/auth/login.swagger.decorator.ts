import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from '@app/infrastructure/dto';
import { LoginResponse } from '@app/infrastructure/responses';

export function LoginSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Аутентификация' }),
        ApiBody({
            type: LoginDto,
            description:
                'Структура входных данных для аутентификации пользователя',
            schema: {
                examples: {
                    valid: {
                        summary: 'Валидный вход',
                        value: {
                            email: 'user@example.com',
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
                            email: 'user@example.com',
                            password: '123456',
                        },
                    },
                },
            },
        }),
        ApiResponse({
            description: 'Login',
            status: HttpStatus.OK,
            type: LoginResponse,
        }),
        ApiUnauthorizedResponse({
            description: 'Unauthorized Response',
            schema: {
                anyOf: [
                    {
                        title: 'Не верно введенный email',
                        description: 'Не верно введенный email',
                        example: {
                            status: HttpStatus.UNAUTHORIZED,
                            message: 'Не корректный email',
                        },
                    },
                    {
                        title: 'Не верно введенный пароль',
                        description: 'Не верно введенный пароль',
                        example: {
                            status: HttpStatus.UNAUTHORIZED,
                            message: 'Не корректный пароль',
                        },
                    },
                ],
            },
        }),
    );
}
