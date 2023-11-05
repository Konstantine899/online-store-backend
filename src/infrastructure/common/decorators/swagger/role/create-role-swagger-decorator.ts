import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateRoleDto } from '@app/infrastructure/dto';
import { CreateRoleResponse } from '../../../../responses/role/create-role.response';

export function CreateRoleSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Создание роли пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            description:
                'Структура входных данных для создания роли пользователя',
            type: CreateRoleDto,
        }),
        ApiResponse({
            status: HttpStatus.CREATED,
            description: 'Created role user',
            type: CreateRoleResponse,
        }),
    );
}
