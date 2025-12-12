import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';

export function UpdateUserFlagsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновить флаги пользователя',
            description: 'Обновляет флаги профиля текущего пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({ type: UpdateUserFlagsDto }),
        ApiResponse({ status: HttpStatus.OK, description: 'Флаги обновлены' }),
    );
}
