import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { AssignRoleDto } from '@app/infrastructure/dto';
import { AssignRoleResponse } from '@app/infrastructure/responses';

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

