import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveRoleDto } from '../dto/remove-role.dto';
import { RemoveRoleResponse } from '../responses/remove-role.response';

export function RemoveRoleUserDocumentation() {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление роли у пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            description: 'Входные данные для удаления пользователя',
            type: RemoveRoleDto,
        }),
        ApiResponse({
            description: 'Remove Role',
            status: HttpStatus.OK,
            type: RemoveRoleResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                anyOf: [
                    {
                        title: 'Пользователь не найден в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/user/role/delete',
                            path: '/online-store/user/role/delete',
                            name: 'NotFoundException',
                            message: 'Пользователь не найден в БД',
                        },
                    },
                    {
                        title: 'Роль не найдена в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/user/role/delete',
                            path: '/online-store/user/role/delete',
                            name: 'NotFoundException',
                            message: 'Роль ADMIN1 не найдена в БД',
                        },
                    },
                ],
            },
        }),
        ApiForbiddenResponse({
            description: 'Forbidden',
            status: HttpStatus.FORBIDDEN,
            schema: {
                title: 'Запрет удаления роли USER',
                example: {
                    status: HttpStatus.FORBIDDEN,
                    message: 'Удаление роли USER запрещено',
                },
            },
        }),
    );
}
