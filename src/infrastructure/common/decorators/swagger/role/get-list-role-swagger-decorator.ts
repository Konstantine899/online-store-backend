import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { GetListRoleResponse } from '../../../../responses/role/get-list-role.response';

export function GetListRoleSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Список ролей' }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.OK,
            type: [GetListRoleResponse],
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Роли пользователя не найдены',
                example: {
                    status: HttpStatus.NOT_FOUND,
                    message: 'Роли не найдены',
                },
            },
        }),
    );
}
