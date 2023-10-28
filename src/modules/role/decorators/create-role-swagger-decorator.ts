import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateRoleDto } from '../dto/create-role.dto';
import { CreateRoleResponse } from '../responses/create-role.response';

export function CreateRoleSwaggerDecorator() {
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