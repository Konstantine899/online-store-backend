import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from '@app/infrastructure/dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { CreateUserResponse } from '@app/infrastructure/responses';

export function CreateUserSwaggerDecorator(): MethodDecorator {
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
        ApiResponse({
            status: HttpStatus.CONFLICT,
            description: 'Пользователь уже существует',
        }),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Требуется аутентификация',
        }),
        ApiResponse({
            status: HttpStatus.FORBIDDEN,
            description: 'Нет прав',
        }),
        ApiBadRequestResponse({
            description: 'Ошибка валидации',
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
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
