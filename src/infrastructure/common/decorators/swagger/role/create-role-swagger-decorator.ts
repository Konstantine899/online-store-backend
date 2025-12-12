import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateRoleDto } from '@app/infrastructure/dto';
import { CreateRoleResponse } from '@app/infrastructure/responses';

export function CreateRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Создание роли',
            description: 'Создание новой роли в системе',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            description: 'Данные для создания роли',
            type: CreateRoleDto,
        }),
        ApiResponse({
            status: HttpStatus.CREATED,
            description: 'Роль успешно создана',
            type: CreateRoleResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
            schema: {
                title: 'Ошибка валидации',
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'Укажите название роли',
                        'Описание роли не может быть длиннее 200 символов',
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
                    message: 'У вас недостаточно прав для создания ролей',
                },
            },
        }),
    );
}
