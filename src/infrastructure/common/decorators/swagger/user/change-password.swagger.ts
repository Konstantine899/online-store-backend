import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChangePasswordDto } from '@app/infrastructure/dto/user/change-password.dto';

export const ChangePasswordSwaggerDecorator = () =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({ summary: 'Сменить пароль', description: 'Меняет пароль текущего пользователя' }),
        ApiBody({ type: ChangePasswordDto }),
        ApiResponse({ status: HttpStatus.OK, description: 'Пароль успешно изменён' }),
    );


