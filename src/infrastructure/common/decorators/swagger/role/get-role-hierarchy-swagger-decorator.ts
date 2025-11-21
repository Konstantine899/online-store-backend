import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
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
    );
}

