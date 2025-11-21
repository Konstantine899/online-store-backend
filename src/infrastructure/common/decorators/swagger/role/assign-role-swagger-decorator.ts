import { AssignRoleDto } from '@app/infrastructure/dto';
import { AssignRoleResponse } from '@app/infrastructure/responses';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';

export function AssignRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Назначение роли пользователю',
            description:
                'Назначает указанную роль пользователю в контексте тенанта',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            description: 'Данные для назначения роли',
            type: AssignRoleDto,
        }),
        ApiResponse({
            status: HttpStatus.CREATED,
            description: 'Роль успешно назначена пользователю',
            type: AssignRoleResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
            schema: {
                title: 'Ошибка валидации',
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'userId должен быть целым числом',
                        'roleId должен быть положительным числом',
                    ],
                },
            },
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
            schema: {
                title: 'Доступ запрещён',
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас недостаточно прав для назначения ролей',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Пользователь или роль не найдены',
            schema: {
                title: 'Ресурс не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Пользователь или роль не найдены',
                },
            },
        }),
    );
}
