import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { UpdateRoleDto } from '@app/infrastructure/dto';
import { UpdateRoleResponse } from '@app/infrastructure/responses';

export function UpdateRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновление роли',
            description:
                'Обновление существующей роли. Все поля опциональны (PATCH).',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: Number,
            description: 'ID роли для обновления',
            example: 5,
        }),
        ApiBody({
            description: 'Данные для обновления роли',
            type: UpdateRoleDto,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Роль успешно обновлена',
            type: UpdateRoleResponse,
        }),
        ApiNotFoundResponse({
            description: 'Роль не найдена',
            schema: {
                title: 'Роль не найдена',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Роль с указанным ID не найдена',
                },
            },
        }),
    );
}

