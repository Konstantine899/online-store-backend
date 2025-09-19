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
