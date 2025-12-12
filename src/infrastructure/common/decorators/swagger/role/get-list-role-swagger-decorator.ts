import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { GetListRoleResponse } from '@app/infrastructure/responses';

export function GetListRoleSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Список ролей',
            description: 'Возвращает список всех ролей в системе',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Список ролей успешно получен',
            type: [GetListRoleResponse],
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
            schema: {
                title: 'Доступ запрещён',
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас недостаточно прав для просмотра списка ролей',
                },
            },
        }),
    );
}
