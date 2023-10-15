import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { CreateUserResponse } from '../responses/create-user.response';

export function CreateUserDocumentation() {
    return applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({ summary: 'Создание пользователя' }),
        ApiBody({
            type: CreateUserDto,
            description: 'Структура входных данных для создания пользователя',
        }),
        ApiResponse({
            description: 'Created user',
            status: HttpStatus.CREATED,
            type: CreateUserResponse,
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            status: HttpStatus.BAD_REQUEST,
            schema: {
                anyOf: [
                    {
                        title: 'Существующий email в БД',
                        example: {
                            statusCode: HttpStatus.BAD_REQUEST,
                            message:
                                'Пользователь с таким email: test@gmail.com уже существует',
                            error: 'Bad Request',
                        },
                    },
                    {
                        title: 'Не верный формат email',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'email',
                            messages: ['Не верный формат email'],
                            value: 'testgmail.com',
                        },
                    },
                    {
                        title: 'Валидация пароля',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'password',
                            messages: [
                                'Пароль пользователя должен быть не менее 6 символов',
                                'Поле пароль не должно быть пустым',
                            ],
                            value: '12345',
                        },
                    },
                ],
            },
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Роль USER не найдена в БД',
                example: {
                    status: 404,
                    message: 'Роль USER не найдена в БД',
                },
            },
        }),
    );
}
