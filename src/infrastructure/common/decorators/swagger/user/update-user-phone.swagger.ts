import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export const UpdateUserPhoneSwaggerDecorator = () =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({ summary: 'Обновить телефон', description: 'Обновляет номер телефона текущего пользователя' }),
        ApiOkResponse({ description: 'Телефон успешно обновлён' }),
    );