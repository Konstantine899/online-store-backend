import { UserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetUserAddressesSwaggerDecorator = (): MethodDecorator =>
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
