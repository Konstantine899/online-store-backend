import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';

export const GetUserAddressesSwaggerDecorator = () =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({
            summary: 'Список адресов',
            description: 'Возвращает адреса текущего пользователя',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Успех',
            type: UserAddressResponse,
            isArray: true,
        }),
    );
