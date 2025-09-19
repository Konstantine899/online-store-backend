import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOperation,
} from '@nestjs/swagger';
import { AddRoleDto } from '@app/infrastructure/dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { AddRoleResponse } from '@app/infrastructure/responses';

export function AddRoleUserSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Добавление роли пользователю' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: AddRoleDto,
            description:
                'Структура входных данных для добавления роли пользователю',
        }),
        ApiCreatedResponse({
            description: 'Add Role',
            type: AddRoleResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                anyOf: [
                    {
                        title: 'Пользователь',
                        description: 'Пользователь не найден в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/user/role/add',
                            path: '/online-store/user/role/add',
                            name: 'NotFoundException',
                            message: 'Пользователь не найден в БД',
                        },
                    },
                    {
                        title: 'Роль пользователя',
                        description: 'Роль не найдена в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/user/role/add',
                            path: '/online-store/user/role/add',
                            name: 'NotFoundException',
                            message: 'Роль не найдена в БД',
                        },
                    },
                ],
            },
        }),
        ApiConflictResponse({
            description: 'Conflict',
            schema: {
                example: {
                    statusCode: HttpStatus.CONFLICT,
                    message: 'Данному пользователю уже присвоена роль ADMIN',
                },
            },
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            schema: {
                title: 'Валидация',
                anyOf: [
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'role',
                            messages: ['Укажите role пользователя'],
                            value: '',
                        },
                    },
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'role',
                            messages: ['Поле role должно быть строкой'],
                            value: 1,
                        },
                    },
                ],
            },
        }),
    );
}
