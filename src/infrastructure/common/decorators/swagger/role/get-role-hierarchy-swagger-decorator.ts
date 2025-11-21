import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { GetRoleHierarchyResponse } from '@app/infrastructure/responses';

export function GetRoleHierarchySwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение иерархии ролей',
            description:
                'Возвращает полную иерархию ролей, сгруппированных по типам (системные, тенантские, клиентские)',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Иерархия ролей успешно получена',
            type: GetRoleHierarchyResponse,
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
            schema: {
                title: 'Доступ запрещён',
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message:
                        'У вас недостаточно прав для просмотра иерархии ролей',
                },
            },
        }),
    );
}

